import React, { useState } from 'react';
import { postsAPI } from '../services/api';
import { useApiAction } from '../hooks/useApi';

const Comment = ({ comment, onReply, onLikeUpdate, onKarmaUpdate, level = 0 }) => {
  const { execute: toggleLike, loading: likeLoading } = useApiAction();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  const handleLike = async () => {
    const result = await toggleLike(() => postsAPI.toggleLike('comment', comment.id));
    
    if (result.success) {
      setIsLiked(result.data.liked);
      setLikeCount(result.data.like_count);
      onLikeUpdate?.(comment.id, result.data);
      
      // Update author's karma (1 karma for comment like/unlike)
      if (comment.author) {
        const karmaChange = result.data.liked ? 1 : -1;
        onKarmaUpdate?.(comment.author.id, karmaChange);
      }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    await onReply?.(comment.id, replyContent);
    setReplyContent('');
    setShowReplyForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const marginLeft = level > 0 ? `${level * 24}px` : '0';

  return (
    <div className={`${level > 0 ? 'border-l-2 border-gray-200 pl-4' : ''}`} style={{ marginLeft }}>
      <div className="mb-4">
        {/* Comment Header */}
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {comment.author?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="ml-2">
            <div className="flex items-center space-x-2">
              <h4 className="font-semibold text-gray-900 text-sm">{comment.author?.username || 'Anonymous'}</h4>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                {comment.author?.total_karma || 0} karma
              </span>
            </div>
            <p className="text-xs text-gray-500">{formatDate(comment.created_at)}</p>
          </div>
        </div>

        {/* Comment Content */}
        <div className="mb-2">
          <p className="text-gray-800 text-sm whitespace-pre-wrap">{comment.content}</p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleLike}
            disabled={likeLoading}
            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            } ${likeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <svg
              className="w-4 h-4"
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
            <span>{likeCount}</span>
            {likeLoading && <span className="text-xs">...</span>}
          </button>

          <button
            onClick={() => setShowReplyForm(!showReplyForm)}
            className="flex items-center space-x-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            <span>Reply</span>
          </button>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <form onSubmit={handleReply}>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${comment.author?.username || 'this comment'}...`}
                className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 text-xs text-gray-600 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Nested Comments */}
        {comment.children && comment.children.length > 0 && (
          <div className="mt-4">
            {comment.children.map((childComment) => (
              <Comment
                key={childComment.id}
                comment={childComment}
                onReply={onReply}
                onLikeUpdate={onLikeUpdate}
                onKarmaUpdate={onKarmaUpdate}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
