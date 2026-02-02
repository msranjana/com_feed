import React, { useState, useEffect } from 'react';
import { postsAPI } from '../services/api';
import { useApiAction } from '../hooks/useApi';
import Comment from './Comment';

const CommentModal = ({ post, isOpen, onClose, onKarmaUpdate }) => {
  const [commentsData, setCommentsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { execute: createComment, loading: creating } = useApiAction();
  const [newComment, setNewComment] = useState('');

  // Extract comments from the threaded response
  const comments = commentsData?.comments || [];

  // Fetch comments when modal opens with a specific post
  useEffect(() => {
    if (isOpen && post?.id) {
      const fetchComments = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await postsAPI.getComments(post.id);
          setCommentsData(response.data);
        } catch (err) {
          setError(err.response?.data?.error || err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchComments();
    }
  }, [isOpen, post?.id]); // Only run when isOpen or post.id changes

  useEffect(() => {
    if (isOpen) {
      setNewComment('');
    }
  }, [isOpen]);

  const handleCreateComment = async (parentId, content) => {
    if (!post) return;
    
    const commentData = {
      content,
      ...(parentId && { parent: parentId })
    };

    const result = await createComment(() => postsAPI.createComment(post.id, commentData));
    
    if (result.success) {
      // Refetch comments after creating a new one
      try {
        const response = await postsAPI.getComments(post.id);
        setCommentsData(response.data);
      } catch (err) {
        console.error('Failed to refetch comments:', err);
      }
    }
  };

  const handleTopLevelComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    await handleCreateComment(null, newComment);
    setNewComment('');
  };

  const handleCommentLike = (commentId, likeData) => {
    // Update the comment in the local state
    if (comments) {
      const updateCommentLikes = (comments) => {
        return comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, like_count: likeData.like_count };
          }
          if (comment.children) {
            return { ...comment, children: updateCommentLikes(comment.children) };
          }
          return comment;
        });
      };

      commentsData.comments = updateCommentLikes(comments);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Comments</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Post Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {post?.author?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-2">
                <h4 className="font-semibold text-sm">{post?.author?.username || 'Anonymous'}</h4>
                <p className="text-xs text-gray-500">
                  {post?.created_at ? new Date(post.created_at).toLocaleString() : ''}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-800 line-clamp-3">{post?.content || ''}</p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Comment Form */}
          <div className="mb-6">
            <form onSubmit={handleTopLevelComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={creating}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={creating || !newComment.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Posting...' : 'Comment'}
                </button>
              </div>
            </form>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Error loading comments</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => {
                  // Refetch comments manually
                  if (post?.id) {
                    postsAPI.getComments(post.id)
                      .then(response => setCommentsData(response.data))
                      .catch(err => setError(err.response?.data?.error || err.message));
                  }
                }}
                className="mt-2 text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Try Again
              </button>
            </div>
          ) : comments?.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No comments yet</div>
              <p className="text-gray-400 text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments?.map((comment) => (
                <Comment
                  key={comment.id}
                  comment={comment}
                  onReply={handleCreateComment}
                  onLikeUpdate={handleCommentLike}
                  onKarmaUpdate={onKarmaUpdate}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {comments?.length || 0} comment{comments?.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
