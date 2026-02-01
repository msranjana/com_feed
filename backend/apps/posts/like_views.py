from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.contenttypes.models import ContentType

from .models import Post, Like


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def posts_like_status(request):
    """Get like status for multiple posts efficiently."""
    post_ids = request.GET.getlist('post_ids')
    
    if not post_ids:
        return Response({'error': 'No post IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Convert to integers
        post_ids = [int(pid) for pid in post_ids]
    except ValueError:
        return Response({'error': 'Invalid post IDs'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Get content type for posts
    post_content_type = ContentType.objects.get_for_model(Post)
    
    # Get all likes by current user for these posts
    user_likes = Like.objects.filter(
        user=request.user,
        content_type=post_content_type,
        object_id__in=post_ids
    ).values_list('object_id', flat=True)
    
    # Return dictionary mapping post_id -> is_liked
    like_status = {str(post_id): post_id in user_likes for post_id in post_ids}
    
    return Response(like_status)
