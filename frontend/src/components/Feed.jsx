import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import { useApi, useApiAction } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import Post from './Post';

const Feed = ({ onCommentClick, onLikeActivity }) => {
  const { data: posts, loading, error, refetch } = useApi(postsAPI.getPosts);
  const { execute: createPost, loading: creating } = useApiAction();
  const { isAuthenticated } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [likeStatus, setLikeStatus] = useState({});

  // Fetch like status for all posts when posts data changes or user auth state changes
  useEffect(() => {
    console.log('Feed useEffect triggered:', { posts: posts?.results, isAuthenticated, postsLength: posts?.results?.length });
    if (posts?.results && posts.results.length > 0 && isAuthenticated) {
      const postIds = posts.results.map(post => post.id);
      console.log('Fetching like status for post IDs:', postIds);
      postsAPI.getLikeStatus(postIds)
        .then(response => {
          console.log('Like status response:', response.data);
          setLikeStatus(response.data);
          console.log('Posts with like status:', posts.results.map(post => ({
            id: post.id,
            is_liked: response.data[post.id] || false
          })));
        })
        .catch(error => {
          console.error('Failed to fetch like status:', error);
        });
    } else if (!isAuthenticated) {
      // Clear like status when user logs out
      setLikeStatus({});
    }
  }, [posts?.results, isAuthenticated]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const result = await createPost(() => postsAPI.createPost({ content: newPostContent }));
    
    if (result.success) {
      setNewPostContent('');
      setShowCreateForm(false);
      refetch();
    }
  };

  const handleLikeUpdate = (postId, likeData) => {
    console.log('Feed handleLikeUpdate called:', { postId, likeData });
    // Update like status for the specific post
    setLikeStatus(prev => {
      const newStatus = {
        ...prev,
        [postId]: likeData.liked
      };
      console.log('Updated likeStatus:', newStatus);
      return newStatus;
    });
    
    // Update the like count in the posts data
    if (posts?.results) {
      const updatedPosts = posts.results.map(post =>
        post.id === postId 
          ? { ...post, like_count: likeData.like_count }
          : post
      );
      posts.results = updatedPosts;
    } else if (posts) {
      const updatedPosts = posts.map(post =>
        post.id === postId 
          ? { ...post, like_count: likeData.like_count }
          : post
      );
      // Update the posts reference to trigger re-render
      Object.assign(posts, updatedPosts);
    }
    
    // Trigger leaderboard refresh
    onLikeActivity?.();
  };

  const handleKarmaUpdate = (userId, karmaChange) => {
    console.log('Feed handleKarmaUpdate called:', { userId, karmaChange });
    
    // Update the karma in posts data
    if (posts?.results) {
      const updatedPosts = posts.results.map(post => {
        if (post.author?.id === userId) {
          return {
            ...post,
            author: {
              ...post.author,
              total_karma: (post.author.total_karma || 0) + karmaChange
            }
          };
        }
        return post;
      });
      posts.results = updatedPosts;
    } else if (posts) {
      const updatedPosts = posts.map(post => {
        if (post.author?.id === userId) {
          return {
            ...post,
            author: {
              ...post.author,
              total_karma: (post.author.total_karma || 0) + karmaChange
            }
          };
        }
        return post;
      });
      Object.assign(posts, updatedPosts);
    }
  };

  const handleCommentClick = (post) => {
    onCommentClick?.(post);
  };

  const postsList = posts?.results || posts || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Create Post Button */}
      <div className="mb-6">
        {!isAuthenticated ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 text-sm">
              Please <span className="font-semibold">sign in</span> to create posts and interact with the community.
            </p>
          </div>
        ) : !showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-blue-500 text-white rounded-lg p-4 hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>Create Post</span>
          </button>
        ) : (
          <form onSubmit={handleCreatePost} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="mb-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                disabled={creating}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={creating || !newPostContent.trim()}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Posting...' : 'Post'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPostContent('');
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 text-sm">Failed to load posts</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        ) : postsList.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
            <p className="text-gray-500">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          postsList.map((post) => (
            <Post
              key={post.id}
              post={{ ...post, is_liked: likeStatus[post.id] || false }}
              onLikeUpdate={handleLikeUpdate}
              onCommentClick={handleCommentClick}
              onKarmaUpdate={handleKarmaUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Feed;
