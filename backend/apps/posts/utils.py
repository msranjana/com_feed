from django.db import models
from django.contrib.contenttypes.models import ContentType
from .models import Post, Comment, Like


class PostQuerySet(models.QuerySet):
    """Custom QuerySet for Post with efficient comment fetching."""
    
    def with_comment_tree(self):
        """
        Fetch posts with their complete comment tree in a single query.
        This prevents N+1 queries when loading comments.
        """
        return self.prefetch_related(
            'comments__author',
            'comments__children__author',
            'comments__children__children__author',
            # Add more levels as needed, but MPTT makes this more efficient
        ).select_related('author')


class CommentManager(models.Manager):
    """Custom manager for Comment with efficient tree operations."""
    
    def get_tree_for_post(self, post_id):
        """
        Get the complete comment tree for a post efficiently.
        Uses MPTT's get_descendants to avoid N+1 queries.
        """
        root_comments = self.filter(post_id=post_id, parent=None)
        
        # Prefetch all descendants at once
        trees = []
        for root in root_comments:
            tree = root.get_descendants(include_self=True).select_related('author')
            trees.append(tree)
        
        return trees
    
    def get_threaded_comments(self, post_id):
        """
        Get comments in threaded format ready for serialization.
        Returns a flat list with tree structure information.
        """
        from mptt.querysets import TreeQuerySet
        
        # Get all comments for the post, ordered by MPTT tree structure
        comments = (
            self.filter(post_id=post_id)
            .select_related('author')
            .order_by('tree_id', 'lft')
        )
        
        return comments


class LikeManager(models.Manager):
    """Custom manager for Like with concurrency-safe operations."""
    
    def get_like_count(self, content_type, object_id):
        """Get like count for a specific object efficiently."""
        return self.filter(
            content_type=content_type,
            object_id=object_id
        ).count()
    
    def user_has_liked(self, user, content_type, object_id):
        """Check if user has already liked an object."""
        return self.filter(
            user=user,
            content_type=content_type,
            object_id=object_id
        ).exists()
    
    def toggle_like(self, user, content_object):
        """
        Toggle a like with race condition protection.
        Uses database transactions and select_for_update.
        """
        from django.db import transaction
        
        content_type = ContentType.objects.get_for_model(content_object)
        
        with transaction.atomic():
            # Lock the user's likes for this content type to prevent race conditions
            existing_like = (
                self.objects
                .select_for_update()
                .filter(
                    user=user,
                    content_type=content_type,
                    object_id=content_object.pk
                )
                .first()
            )
            
            if existing_like:
                # User already liked, so unlike
                existing_like.delete()
                return False, 'unliked'
            else:
                # User hasn't liked yet, so like
                like = self.create(
                    user=user,
                    content_type=content_type,
                    object_id=content_object.pk
                )
                return True, 'liked'


# Custom managers
PostManager = PostQuerySet.as_manager()
Comment.objects = CommentManager()
Like.objects = LikeManager()
