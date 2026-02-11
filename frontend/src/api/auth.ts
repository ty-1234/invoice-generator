import { api } from './client';
import type { User } from '../types';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  register: (input: RegisterInput) =>
    api.post<{ user: User; accessToken: string }>('/auth/register', input),
  login: (input: LoginInput) =>
    api.post<{ user: User; accessToken: string }>('/auth/login', input),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post<{ accessToken: string }>('/auth/refresh'),
  me: () => api.get<Omit<User, 'id'> & { id: string }>('/auth/me'),
};
