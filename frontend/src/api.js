import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);
export const resetPassword = (data) => api.post('/auth/reset-password', data);

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Categories
export const getCategories = () => api.get('/categories');

// Stock
export const adjustStock = (data) => api.post('/stock-adjustments', data);

// Dashboard
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getLowStockItems = () => api.get('/dashboard/low-stock');

// Billing
export const createCheckoutSession = (tier) => api.post('/billing/create-checkout-session', { tier });
export const getBillingStatus = () => api.get('/billing/status');

// Feedback
export const submitFeedback = (data) => api.post('/feedback', data);

// Referrals
export const getReferralStats = () => api.get('/referrals/stats');
export const inviteBusiness = (email) => api.post('/referrals/invite', { email });

export default api;
