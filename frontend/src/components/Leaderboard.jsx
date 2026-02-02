import React, { useEffect, useState } from 'react';
import { gamificationAPI } from '../services/api';
import { useApi } from '../hooks/useApi';

const Leaderboard = ({ refreshTrigger }) => {
  const { data: leaderboardData, loading, error, refetch } = useApi(gamificationAPI.getLeaderboard);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refetch]);

  // Refresh when trigger changes (e.g., when someone likes a post)
  useEffect(() => {
    if (refreshTrigger) {
      refetch();
      setLastRefresh(new Date());
    }
  }, [refreshTrigger, refetch]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">🏆 Top 5 Users </h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">🏆 Top 5 Users</h2>
        <div className="text-red-600 text-sm">
          <p>Failed to load leaderboard</p>
          <p className="text-xs">{error}</p>
        </div>
      </div>
    );
  }

  const users = leaderboardData?.users || [];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🏆 Top 5 (Last 24h)</h2>
        <div className="text-xs text-gray-500">
          Last updated: {formatDate(lastRefresh)}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">No activity in the last 24 hours</div>
          <p className="text-gray-400 text-sm">Be the first to earn karma!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                index === 1 ? 'bg-gray-50 border border-gray-200' :
                index === 2 ? 'bg-orange-50 border border-orange-200' :
                'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold w-8 text-center">
                  {getRankIcon(index + 1)}
                </div>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{user.username}</div>
                  <div className="text-xs text-gray-500">Total: {user.total_karma} karma</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-green-600">
                  +{user.karma_24h}
                </div>
                <div className="text-xs text-gray-500">last 24h</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          💡 Leaderboard shows karma earned in the last 24 hours only
        </div>
        <div className="text-xs text-gray-500 text-center mt-1">
          Post likes = 5 karma | Comment likes = 1 karma
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
