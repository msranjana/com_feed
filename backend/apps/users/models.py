from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    """Extended User model with dynamic karma calculation."""
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return self.username
    
    @property
    def total_karma(self):
        """Calculate total karma from all transactions."""
        from apps.posts.models import Like, Post, Comment
        from django.contrib.contenttypes.models import ContentType
        
        # Get content types for posts and comments
        post_content_type = ContentType.objects.get_for_model(Post)
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        # Calculate karma from likes received
        post_likes_karma = Like.objects.filter(
            content_type=post_content_type,
            object_id__in=self.posts.values_list('id', flat=True)
        ).count() * 5  # 5 karma per post like
        
        comment_likes_karma = Like.objects.filter(
            content_type=comment_content_type,
            object_id__in=self.comments.values_list('id', flat=True)
        ).count() * 1  # 1 karma per comment like
        
        return post_likes_karma + comment_likes_karma
    
    @property
    def daily_karma(self):
        """Calculate karma earned in the last 24 hours."""
        from apps.posts.models import Like, Post, Comment
        from django.contrib.contenttypes.models import ContentType
        
        # Get content types for posts and comments
        post_content_type = ContentType.objects.get_for_model(Post)
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        # Calculate time threshold (24 hours ago)
        twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
        
        # Calculate karma from likes received in last 24 hours
        post_likes_karma = Like.objects.filter(
            content_type=post_content_type,
            object_id__in=self.posts.values_list('id', flat=True),
            created_at__gte=twenty_four_hours_ago
        ).count() * 5  # 5 karma per post like
        
        comment_likes_karma = Like.objects.filter(
            content_type=comment_content_type,
            object_id__in=self.comments.values_list('id', flat=True),
            created_at__gte=twenty_four_hours_ago
        ).count() * 1  # 1 karma per comment like
        
        return post_likes_karma + comment_likes_karma
