import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Wishlists API
export const wishlistsAPI = {
  getAll: () => api.get('/wishlists'),
  getById: (id) => api.get(`/wishlists/${id}`),
  create: (wishlistData) => api.post('/wishlists', wishlistData),
  update: (id, wishlistData) => api.put(`/wishlists/${id}`, wishlistData),
  delete: (id) => api.delete(`/wishlists/${id}`),
  joinByInvite: (inviteCode) => api.post(`/wishlists/join/${inviteCode}`),
  generateInvite: (id) => api.post(`/wishlists/${id}/invite`),
};

// Products API
export const productsAPI = {
  getByWishlist: (wishlistId) => api.get(`/products/wishlist/${wishlistId}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  addComment: (id, comment) => api.post(`/products/${id}/comments`, comment),
  addReaction: (id, reaction) => api.post(`/products/${id}/reactions`, reaction),
  removeReaction: (id) => api.delete(`/products/${id}/reactions`),
};

// Upload API
export const uploadAPI = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadProductImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/product-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (imageUrl) => api.delete('/upload/image', { data: { imageUrl } }),
  testConfig: () => api.get('/upload/test'),
};

export default api;
