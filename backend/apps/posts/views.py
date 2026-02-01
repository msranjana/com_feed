from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from apps.users.models import User
from .models import Post, Comment, Like
from .serializers import (
    PostSerializer, PostCreateSerializer, CommentSerializer,
    CommentCreateSerializer, LikeSerializer
)


class PostListCreateView(generics.ListCreateAPIView):
    """View to list and create posts."""
    queryset = Post.objects.select_related('author').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PostCreateSerializer
        return PostSerializer
    
    def get_queryset(self):
        """Optimize queryset to prevent N+1 queries."""
        return Post.objects.select_related('author').all()


class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update, and delete posts."""
    queryset = Post.objects.select_related('author').all()
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Optimize queryset."""
        return Post.objects.select_related('author').all()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def toggle_like(request, content_type, object_id):
    """
    Toggle like/unlike on posts and comments.
    Handles race conditions with database transactions.
    """
    try:
        # Get the content type
        if content_type == 'post':
            content_object = Post.objects.get(pk=object_id)
        elif content_type == 'comment':
            content_object = Comment.objects.get(pk=object_id)
        else:
            return Response(
                {'error': 'Invalid content type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Toggle the like with race condition protection
        liked, action = Like.toggle_like(request.user, content_object)
        
        return Response({
            'liked': liked,
            'action': action,
            'like_count': content_object.like_count
        })
        
    except Post.DoesNotExist:
        return Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Comment.DoesNotExist:
        return Response(
            {'error': 'Comment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class CommentListCreateView(generics.ListCreateAPIView):
    """View to list and create comments for a specific post."""
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """Get comments for a specific post with MPTT ordering."""
        post_id = self.kwargs['post_id']
        return Comment.objects.filter(
            post_id=post_id
        ).select_related('author').order_by('tree_id', 'lft')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CommentCreateSerializer
        return CommentSerializer
    
    def get_serializer_context(self):
        """Add post to serializer context."""
        context = super().get_serializer_context()
        context['post'] = Post.objects.get(pk=self.kwargs['post_id'])
        return context


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """View to retrieve, update, and delete comments."""
    queryset = Comment.objects.select_related('author').all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def post_comments(request, post_id):
    """
    Get comments for a post in threaded format.
    Optimized to prevent N+1 queries using MPTT and bulk operations.
    """
    try:
        from django.contrib.contenttypes.models import ContentType
        from django.db.models import Count
        
        post = Post.objects.get(pk=post_id)
        comments = post.get_comment_tree().select_related('author')
        
        # Prefetch like counts to prevent N+1 queries
        comment_content_type = ContentType.objects.get_for_model(Comment)
        like_counts = (
            Like.objects
            .filter(content_type=comment_content_type, object_id__in=[c.id for c in comments])
            .values('object_id')
            .annotate(count=Count('id'))
        )
        
        # Create a mapping of comment_id -> like_count
        like_count_map = {item['object_id']: item['count'] for item in like_counts}
        
        # Bulk serialize all comments at once to prevent N+1 queries
        serializer = CommentSerializer(comments, many=True)
        serialized_comments = serializer.data
        
        # Add like counts to serialized data
        for comment_data in serialized_comments:
            comment_data['like_count'] = like_count_map.get(comment_data['id'], 0)
        
        # Build threaded structure from already serialized data
        def build_tree(serialized_comments_list):
            """Build threaded comment tree from serialized list."""
            tree = {}
            for comment_data in serialized_comments_list:
                comment_data['children'] = []
                tree[comment_data['id']] = comment_data
            
            # Build parent-child relationships
            root_comments = []
            for comment_data in serialized_comments_list:
                if comment_data['parent_id']:
                    if comment_data['parent_id'] in tree:
                        tree[comment_data['parent_id']]['children'].append(tree[comment_data['id']])
                else:
                    root_comments.append(tree[comment_data['id']])
            
            return root_comments
        
        threaded_comments = build_tree(serialized_comments)
        
        return Response({
            'post': PostSerializer(post).data,
            'comments': threaded_comments
        })
        
    except Post.DoesNotExist:
        return Response(
            {'error': 'Post not found'},
            status=status.HTTP_404_NOT_FOUND
        )
