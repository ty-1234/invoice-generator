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
  downloadPdf: async (id: string) => {
    const res = await fetch(`/api/v1/invoices/${id}/pdf`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({} as { message?: string }));
      const err = new Error(data.message || 'Failed to download PDF') as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    return res.blob();
  },
  createPaymentIntent: (invoiceId: string) =>
    api.post<{ clientSecret: string; amount: number }>(`/invoices/${invoiceId}/pay`),
};
