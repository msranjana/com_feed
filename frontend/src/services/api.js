import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'with token');
  } else {
    console.log('API Request:', config.method?.toUpperCase(), config.url, 'without token');
  }
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, error.response?.status);
    return Promise.reject(error);
  }
);

// Posts API
export const postsAPI = {
  getPosts: () => api.get('/posts/'),
  getPost: (id) => api.get(`/posts/${id}/`),
  createPost: (data) => api.post('/posts/', data),
  updatePost: (id, data) => api.put(`/posts/${id}/`, data),
  deletePost: (id) => api.delete(`/posts/${id}/`),
  getComments: (postId) => api.get(`/posts/${postId}/comments/threaded/`),
  createComment: (postId, data) => api.post(`/posts/${postId}/comments/`, data),
  updateComment: (id, data) => api.put(`/comments/${id}/`, data),
  deleteComment: (id) => api.delete(`/comments/${id}/`),
  toggleLike: (contentType, objectId) => api.post(`/posts/like/${contentType}/${objectId}/`),
  getLikeStatus: (postIds) => api.get('/posts/like-status/', { params: { post_ids: postIds } }),
};

// Gamification API
export const gamificationAPI = {
  getLeaderboard: () => api.get('/gamification/leaderboard/'),
  getUserKarma: (userId) => api.get(`/gamification/users/${userId}/karma/`),
};

// Authentication API
export const authAPI = {
  register: (data) => api.post('/users/register/', data),
  login: (data) => api.post('/users/login/', data),
  logout: () => api.post('/users/logout/'),
  profile: () => api.get('/users/profile/'),
};

export default api;
