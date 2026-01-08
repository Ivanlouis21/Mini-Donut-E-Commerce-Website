import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  ChangePasswordFormData,
  UpdateProfileFormData,
  UpdateProfilePictureFormData,
  AuthResponse,
  ForgotPasswordResponse,
  User,
} from '../types/auth.types';

const API_BASE_URL = 'http://localhost:3001';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

export const authAPI = {
  register: (data: RegisterFormData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),
  login: (data: LoginFormData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),
  forgotPassword: (data: ForgotPasswordFormData): Promise<AxiosResponse<ForgotPasswordResponse>> =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: ResetPasswordFormData): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/auth/reset-password', data),
  changePassword: (data: ChangePasswordFormData): Promise<AxiosResponse<{ message: string }>> =>
    api.post('/auth/change-password', data),
  updateProfile: (data: UpdateProfileFormData): Promise<AxiosResponse<{ user: User; message: string }>> =>
    api.post('/auth/update-profile', data),
  updateProfilePicture: (data: UpdateProfilePictureFormData): Promise<AxiosResponse<{ message: string; profilePicture: string }>> =>
    api.post('/auth/update-profile-picture', data),
  promoteToAdmin: (email: string): Promise<AxiosResponse<{ message: string; user: User }>> =>
    api.post('/auth/promote-admin', { email }),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => {
    // If data is FormData, send it with appropriate headers
    if (data instanceof FormData) {
      return api.post('/products', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/products', data);
  },
  update: (id: number, data: any) => {
    // If data is FormData, send it with appropriate headers
    if (data instanceof FormData) {
      return api.patch(`/products/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.patch(`/products/${id}`, data);
  },
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const cartAPI = {
  getAll: () => api.get('/cart'),
  addItem: (data: any) => api.post('/cart', data),
  updateItem: (id: number, data: any) => api.patch(`/cart/${id}`, data),
  removeItem: (id: number) => api.delete(`/cart/${id}`),
  clear: () => api.delete('/cart/clear'),
};

export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  getAllAdmin: () => api.get('/orders/admin/all'),
  updateStatus: (id: number, status: string) => api.patch(`/orders/admin/${id}/status`, { status }),
};

export const paymentAPI = {
  createIntent: (data: { 
    amount: number; 
    description: string; 
    returnUrl: string; 
    lineItems?: Array<{ name: string; quantity: number; price: number }>; 
    metadata?: any 
  }) =>
    api.post('/payment/create-intent', data),
  getPublicKey: () => api.get('/payment/public-key'),
  getIntent: (id: string) => api.get(`/payment/intent/${id}`),
};

export const contactAPI = {
  sendMessage: (data: { name: string; email: string; message: string }) =>
    api.post('/contact', data),
  getAll: () => api.get('/contact'),
  getUnreadCount: () => api.get('/contact/unread-count'),
  markAsRead: (id: number) => api.patch(`/contact/${id}/read`),
  delete: (id: number) => api.delete(`/contact/${id}`),
};

export default api;
