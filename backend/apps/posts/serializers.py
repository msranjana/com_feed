from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Post, Comment, Like


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment model with MPTT support."""
    author = UserSerializer(read_only=True)
    parent_id = serializers.IntegerField(read_only=True, allow_null=True)
    
    class Meta:
        model = Comment
        fields = [
            'id', 'author', 'content', 'created_at', 'updated_at',
            'parent_id', 'level'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'level']


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""
    
    class Meta:
        model = Comment
        fields = ['content', 'parent']
    
    def create(self, validated_data):
        """Create comment with post and author from context."""
        post = self.context['post']
        author = self.context['request'].user
        
        comment = Comment.objects.create(
            post=post,
            author=author,
            **validated_data
        )
        return comment


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model."""
    author = UserSerializer(read_only=True)
    like_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'author', 'content', 'created_at', 'updated_at',
            'like_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PostCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating posts."""
    
    class Meta:
        model = Post
        fields = ['content']
    
    def create(self, validated_data):
        """Create post with author from request."""
        author = self.context['request'].user
        return Post.objects.create(author=author, **validated_data)


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for Like model."""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class LikeToggleSerializer(serializers.Serializer):
    """Serializer for like/unlike operations."""
    action = serializers.ChoiceField(choices=['like', 'unlike'])
    
    def validate_action(self, value):
        """Validate the action field."""
        if value not in ['like', 'unlike']:
            raise serializers.ValidationError("Action must be 'like' or 'unlike'")
        return value
