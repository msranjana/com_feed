from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.db.models import UniqueConstraint, F
from mptt.models import MPTTModel, TreeForeignKey

from apps.users.models import User


class PostQuerySet(models.QuerySet):
    """Custom QuerySet for Post with efficient comment fetching."""
    
    def with_comment_tree(self):
        """
        Fetch posts with their complete comment tree efficiently.
        Uses MPTT's tree structure to prevent N+1 queries.
        """
        return self.select_related('author').prefetch_related(
            'comments__author',
        )


class Post(models.Model):
    """Model for community posts."""
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = PostQuerySet.as_manager()
    
    class Meta:
        db_table = 'posts'
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.author.username}: {self.content[:50]}...'
    
    @property
    def like_count(self):
        """Get like count efficiently."""
        from django.contrib.contenttypes.models import ContentType
        from .models import Like
        
        content_type = ContentType.objects.get_for_model(self)
        return Like.objects.filter(
            content_type=content_type,
            object_id=self.pk
        ).count()
    
    def get_comment_tree(self):
        """
        Get the complete comment tree for this post efficiently.
        Uses MPTT to fetch the entire tree in optimal queries.
        """
        return Comment.objects.filter(post=self).order_by('tree_id', 'lft')


class Comment(MPTTModel):
    """Model for threaded comments using MPTT for efficient tree operations."""
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # MPTT fields for tree structure
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    
    class MPTTMeta:
        order_insertion_by = ['created_at']
    
    class Meta:
        db_table = 'comments'
        ordering = ['created_at']
    
    def __str__(self):
        return f'{self.author.username}: {self.content[:50]}...'
    
    @property
    def like_count(self):
        """Get like count efficiently."""
        from django.contrib.contenttypes.models import ContentType
        from .models import Like
        
        content_type = ContentType.objects.get_for_model(self)
        return Like.objects.filter(
            content_type=content_type,
            object_id=self.pk
        ).count()


class Like(models.Model):
    """Model for likes with generic foreign key to posts and comments."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Generic foreign key to link to either Post or Comment
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        db_table = 'likes'
        # Prevent duplicate likes on the same object by the same user
        constraints = [
            UniqueConstraint(fields=['user', 'content_type', 'object_id'], name='unique_like')
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f'{self.user.username} likes {self.content_object}'
    
    @classmethod
    def toggle_like(cls, user, content_object):
        """
        Toggle a like with race condition protection.
        Uses database transactions to ensure atomicity.
        """
        from django.db import transaction
        
        content_type = ContentType.objects.get_for_model(content_object)
        
        with transaction.atomic():
            # Check if like already exists
            existing_like = cls.objects.filter(
                user=user,
                content_type=content_type,
                object_id=content_object.pk
            ).first()
            
            if existing_like:
                # User already liked, so unlike
                existing_like.delete()
                return False, 'unliked'
            else:
                # User hasn't liked yet, so like
                like = cls.objects.create(
                    user=user,
                    content_type=content_type,
                    object_id=content_object.pk
                )
                return True, 'liked'
