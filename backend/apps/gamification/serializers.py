from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import KarmaManager


class LeaderboardUserSerializer(UserSerializer):
    """Serializer for users in leaderboard with 24h karma."""
    karma_24h = serializers.IntegerField(read_only=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['karma_24h']


class LeaderboardSerializer(serializers.Serializer):
    """Serializer for the leaderboard data."""
    users = LeaderboardUserSerializer(many=True, read_only=True)
    generated_at = serializers.DateTimeField(read_only=True)
    
    def to_representation(self, instance):
        """Custom representation for leaderboard."""
        users = instance
        return {
            'users': LeaderboardUserSerializer(users, many=True).data,
            'generated_at': serializers.DateTimeField().to_representation(
                serializers.DateTimeField().get_attribute({})
            )
        }
