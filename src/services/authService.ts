import apiClient from './apiClient';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<{ user: User; message: string }> {
    const response = await apiClient.post<{ user: User; message: string }>('/api/users/register', data);
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<User>('/api/users/me');
    return response.data;
  },

  async refreshToken(): Promise<string> {
    const response = await apiClient.post<{ access_token: string }>('/api/auth/refresh');
    return response.data.access_token;
  },
};