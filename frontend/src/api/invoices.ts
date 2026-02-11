import { api } from './client';
import type { Invoice, PaginatedResponse } from '../types';

export const invoicesApi = {
  list: (params?: { page?: number; limit?: number; status?: string; clientId?: string }) => {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.status) search.set('status', params.status);
    if (params?.clientId) search.set('clientId', params.clientId);
    const q = search.toString();
    return api.get<PaginatedResponse<Invoice>>(`/invoices${q ? `?${q}` : ''}`);
  },
  get: (id: string) => api.get<Invoice>(`/invoices/${id}`),
  create: (data: {
    clientId: string;
    issueDate: string;
    dueDate: string;
    currency?: string;
    notes?: string;
    terms?: string;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
  }) => api.post<Invoice>('/invoices', data),
  update: (id: string, data: Partial<Invoice>) => api.patch<Invoice>(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  createPaymentIntent: (invoiceId: string) =>
    api.post<{ clientSecret: string; amount: number }>(`/invoices/${invoiceId}/pay`),
};
