import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGetMock, apiPostMock, apiPatchMock, apiDeleteMock } = vi.hoisted(() => ({
  apiGetMock: vi.fn(),
  apiPostMock: vi.fn(),
  apiPatchMock: vi.fn(),
  apiDeleteMock: vi.fn(),
}));

vi.mock('./client', () => ({
  api: {
    get: apiGetMock,
    post: apiPostMock,
    patch: apiPatchMock,
    delete: apiDeleteMock,
  },
}));

import { invoicesApi } from './invoices';

describe('invoicesApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds list query string with optional params', () => {
    invoicesApi.list({ page: 2, limit: 10, status: 'paid', clientId: 'client-1' });

    expect(apiGetMock).toHaveBeenCalledWith('/invoices?page=2&limit=10&status=paid&clientId=client-1');
  });

  it('uses base list endpoint when no params are provided', () => {
    invoicesApi.list();

    expect(apiGetMock).toHaveBeenCalledWith('/invoices');
  });

  it('calls resource endpoints for get/create/update/delete', () => {
    invoicesApi.get('inv-1');
    invoicesApi.create({
      clientId: 'client-1',
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
      lineItems: [{ description: 'Work', quantity: 1, unitPrice: 100 }],
    });
    invoicesApi.update('inv-1', { notes: 'updated' } as any);
    invoicesApi.delete('inv-1');

    expect(apiGetMock).toHaveBeenCalledWith('/invoices/inv-1');
    expect(apiPostMock).toHaveBeenCalledWith('/invoices', expect.any(Object));
    expect(apiPatchMock).toHaveBeenCalledWith('/invoices/inv-1', { notes: 'updated' });
    expect(apiDeleteMock).toHaveBeenCalledWith('/invoices/inv-1');
  });

  it('calls payment intent endpoint for invoices', () => {
    invoicesApi.createPaymentIntent('inv-22');

    expect(apiPostMock).toHaveBeenCalledWith('/invoices/inv-22/pay');
  });

  it('downloads invoice PDF as blob', async () => {
    const blob = new Blob(['pdf-bytes'], { type: 'application/pdf' });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => blob,
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await invoicesApi.downloadPdf('inv-1');

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/invoices/inv-1/pdf', {
      method: 'GET',
      credentials: 'include',
    });
    expect(result).toBe(blob);
  });
});
