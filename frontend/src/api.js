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

// Suppliers
export const getSuppliers = () => api.get('/suppliers');
export const createSupplier = (data) => api.post('/suppliers', data);
export const updateSupplier = (id, data) => api.put(`/suppliers/${id}`, data);
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`);

// Runway & Restock
export const getRunwayData = () => api.get('/runway/calculate');
export const generatePO = (productIds) => api.post('/runway/generate-po', { product_ids: productIds });
export const generatePOEmail = (data) => api.post('/runway/po-email', data);

export default api;

// User management
export const getUsers = () => api.get('/users');
export const inviteUser = (data) => api.post('/users/invite', data);
export const updateUserRole = (id, role) => api.put(`/users/${id}/role`, { role });
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const getMe = () => api.get('/auth/me');
