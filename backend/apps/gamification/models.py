from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import Sum, Case, When, IntegerField, F, Count
from django.utils import timezone

from apps.users.models import User


class KarmaManager(models.Manager):
    """Custom manager for karma calculations."""
    
    def get_leaderboard(self, limit=5):
        """
        Get top users by karma earned in the last 24 hours.
        This dynamically calculates karma from like history.
        """
        from apps.posts.models import Like, Post, Comment
        from django.contrib.contenttypes.models import ContentType
        
        # Calculate the timestamp for 24 hours ago
        twenty_four_hours_ago = timezone.now() - timezone.timedelta(hours=24)
        
        # Get content types
        post_content_type = ContentType.objects.get_for_model(Post)
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        # Get karma from post likes in the last 24 hours (5 karma each)
        post_karma = (
            Like.objects
            .filter(
                created_at__gte=twenty_four_hours_ago,
                content_type=post_content_type
            )
            .values('object_id')  # The post ID
            .annotate(post_karma=Count('id') * 5)
        )
        
        # Get karma from comment likes in the last 24 hours (1 karma each)
        comment_karma = (
            Like.objects
            .filter(
                created_at__gte=twenty_four_hours_ago,
                content_type=comment_content_type
            )
            .values('object_id')  # The comment ID
            .annotate(comment_karma=Count('id'))
        )
        
        # Combine the karma data
        combined_karma = {}
        
        # Add post karma
        for item in post_karma:
            post_id = item['object_id']
            try:
                post = Post.objects.get(id=post_id)
                user_id = post.author.id
                combined_karma[user_id] = combined_karma.get(user_id, 0) + item['post_karma']
            except Post.DoesNotExist:
                continue
        
        # Add comment karma
        for item in comment_karma:
            comment_id = item['object_id']
            try:
                comment = Comment.objects.get(id=comment_id)
                user_id = comment.author.id
                combined_karma[user_id] = combined_karma.get(user_id, 0) + item['comment_karma']
            except Comment.DoesNotExist:
                continue
        
        # Get users with karma and sort
        user_ids_with_karma = [user_id for user_id, karma in combined_karma.items() if karma > 0]
        
        if not user_ids_with_karma:
            return []
        
        users = User.objects.filter(id__in=user_ids_with_karma)
        
        # Create leaderboard
        leaderboard = []
        for user in users:
            user.karma_24h = combined_karma[user.id]
            leaderboard.append(user)
        
        # Sort by karma_24h descending and limit
        leaderboard.sort(key=lambda x: x.karma_24h, reverse=True)
        return leaderboard[:limit]


class KarmaTransaction(models.Model):
    """
    Model to track karma transactions for audit purposes.
    This is optional but useful for debugging and analytics.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='karma_transactions')
    karma_change = models.IntegerField()  # Positive for gain, negative for loss
    reason = models.CharField(max_length=100)  # 'post_like', 'comment_like', 'post_unlike', etc.
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'karma_transactions'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.username}: {self.karma_change:+d} ({self.reason})'
