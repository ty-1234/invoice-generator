import { api } from './client';
import type { Client, PaginatedResponse } from '../types';

export const clientsApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const q = search.toString();
    return api.get<PaginatedResponse<Client>>(`/clients${q ? `?${q}` : ''}`);
  },
  get: (id: string) => api.get<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => api.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => api.patch<Client>(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
};
