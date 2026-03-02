import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './client';

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends requests with API prefix, credentials, and JSON headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await api.get('/invoices');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/invoices',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('serializes body for POST and returns parsed response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'inv-1' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.post<{ id: string }>('/invoices', { title: 'March invoice' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/invoices',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: 'March invoice' }),
      })
    );
    expect(result).toEqual({ id: 'inv-1' });
  });

  it('throws error with status and field errors on non-2xx responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({
        message: 'Validation failed',
        errors: [{ field: 'clientId' }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.post('/invoices', {})).rejects.toMatchObject({
      message: 'Validation failed',
      status: 422,
      errors: [{ field: 'clientId' }],
    });
  });
});
