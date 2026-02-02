import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import CommentModal from './components/CommentModal';
import AuthModal from './components/AuthModal';
import './App.css';

function AppContent() {
  const [selectedPost, setSelectedPost] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [leaderboardRefreshTrigger, setLeaderboardRefreshTrigger] = useState(0);
  const { user, isAuthenticated, logout } = useAuth();

  const handleCommentClick = (post) => {
    setSelectedPost(post);
    setIsCommentModalOpen(true);
  };

  const handleCloseCommentModal = () => {
    setIsCommentModalOpen(false);
    setSelectedPost(null);
  };

  const handleAuthClick = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleLikeActivity = () => {
    // Trigger leaderboard refresh when someone likes/unlikes
    setLeaderboardRefreshTrigger(prev => prev + 1);
  };

  const handleKarmaUpdate = (userId, karmaChange) => {
    // Trigger leaderboard refresh when karma changes
    setLeaderboardRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
              <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                Playto Prototype
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{user?.username}</span>
                    <span className="text-xs text-gray-500">({user?.total_karma || 0} karma)</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAuthClick}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feed Section */}
          <div className="lg:col-span-2">
            <Feed onCommentClick={handleCommentClick} onLikeActivity={handleLikeActivity} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Leaderboard refreshTrigger={leaderboardRefreshTrigger} />
            
            {/* Info Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3">How Karma Works ?</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❤️</span>
                  <span>Post like = <strong>5 karma</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-red-500">❤️</span>
                  <span>Comment like = <strong>1 karma</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-green-500">🏆</span>
                  <span>Real-time leaderboard updates</span>
                </div>
              </div>
            </div>

            {/* Technical Features */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3">Technical Features</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">🔒</span>
                  <span>Concurrency-safe likes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">🌳</span>
                  <span>Efficient comment trees</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">📊</span>
                  <span>Dynamic karma aggregation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-500">🚀</span>
                  <span>N+1 query prevention</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Comment Modal */}
      <CommentModal
        post={selectedPost}
        isOpen={isCommentModalOpen}
        onClose={handleCloseCommentModal}
        onKarmaUpdate={handleKarmaUpdate}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>Community Feed Prototype - Built for Playto</p>
            <p className="mt-1">Built with Django + React</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
