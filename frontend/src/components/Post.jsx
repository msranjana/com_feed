import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import { useApiAction } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const Post = ({ post, onLikeUpdate, onCommentClick, onKarmaUpdate }) => {
  const { execute: toggleLike, loading: likeLoading } = useApiAction();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(post.is_liked || false);

  console.log('Post component rendered:', {
    postId: post.id,
    is_liked_from_props: post.is_liked,
    current_isLiked_state: isLiked
  });

  // Update state when post prop changes
  useEffect(() => {
    console.log('Post useEffect triggered:', { 
      postId: post.id, 
      is_liked_from_props: post.is_liked, 
      current_isLiked_state: isLiked 
    });
    setIsLiked(post.is_liked || false);
  }, [post.id, post.is_liked]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to like posts');
      return;
    }
    
    console.log('Like button clicked for post:', post.id, 'Current isLiked:', isLiked);
    const result = await toggleLike(() => postsAPI.toggleLike('post', post.id));
    
    console.log('Like API result:', result);
    
    if (result.success) {
      console.log('Updating like state:', { liked: result.data.liked, count: result.data.like_count });
      setIsLiked(result.data.liked);
      // Don't set local like count - let the parent handle it
      onLikeUpdate?.(post.id, result.data);
      
      // Update author's karma (5 karma for post like/unlike)
      if (post.author) {
        const karmaChange = result.data.liked ? 5 : -5;
        onKarmaUpdate?.(post.author.id, karmaChange);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-4 border border-gray-200">
      {/* Post Header */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
          {post.author?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="ml-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-gray-900">{post.author?.username || 'Anonymous'}</h3>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
              {post.author?.total_karma || 0} karma
            </span>
          </div>
          <p className="text-sm text-gray-500">{formatDate(post.created_at)}</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Post Actions */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={likeLoading || !isAuthenticated}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isLiked
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } ${likeLoading || !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={!isAuthenticated ? 'Sign in to like posts' : ''}
        >
          <svg
            className="w-5 h-5"
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{post.like_count || 0}</span>
          {likeLoading && <span className="text-xs">...</span>}
        </button>

        <button
          onClick={() => onCommentClick?.(post)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>Comment</span>
        </button>
      </div>
    </div>
  );
};

export default Post;
