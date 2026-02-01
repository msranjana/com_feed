from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.utils import timezone
from django.db import models

from .models import KarmaManager
from .serializers import LeaderboardUserSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def leaderboard(request):
    """
    Get the top 5 users by karma earned in the last 24 hours.
    This dynamically calculates karma from like history.
    """
    try:
        karma_manager = KarmaManager()
        top_users = karma_manager.get_leaderboard(limit=5)
        
        # Serialize the data
        serializer = LeaderboardUserSerializer(top_users, many=True)
        
        return Response({
            'users': serializer.data,
            'generated_at': timezone.now(),
            'period': '24_hours'
        })
        
    except Exception as e:
        return Response({
            'error': f'Failed to generate leaderboard: {str(e)}'
        }, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def user_karma_history(request, user_id):
    """
    Get karma history for a specific user.
    This is an additional endpoint for debugging/analytics.
    """
    try:
        from apps.users.models import User
        from django.contrib.contenttypes.models import ContentType
        from apps.posts.models import Like
        
        user = User.objects.get(pk=user_id)
        
        # Calculate karma from likes in different time periods
        now = timezone.now()
        
        # Last 24 hours
        last_24h = now - timezone.timedelta(hours=24)
        karma_24h = Like.objects.filter(
            content_object__author=user,
            created_at__gte=last_24h
        ).aggregate(
            karma=models.Sum(
                models.Case(
                    models.When(content_type__model='post', then=5),
                    models.When(content_type__model='comment', then=1),
                    default=0,
                    output_field=models.IntegerField()
                )
            )
        )['karma'] or 0
        
        # Last 7 days
        last_7d = now - timezone.timedelta(days=7)
        karma_7d = Like.objects.filter(
            content_object__author=user,
            created_at__gte=last_7d
        ).aggregate(
            karma=models.Sum(
                models.Case(
                    models.When(content_type__model='post', then=5),
                    models.When(content_type__model='comment', then=1),
                    default=0,
                    output_field=models.IntegerField()
                )
            )
        )['karma'] or 0
        
        return Response({
            'user_id': user.id,
            'username': user.username,
            'total_karma': user.total_karma,
            'karma_24h': karma_24h,
            'karma_7d': karma_7d,
            'generated_at': now
        })
        
    except User.DoesNotExist:
        return Response({
            'error': 'User not found'
        }, status=404)
    except Exception as e:
        return Response({
            'error': f'Failed to get karma history: {str(e)}'
        }, status=500)
