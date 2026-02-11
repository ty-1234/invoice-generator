const API_BASE = '/api/v1';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data.message || 'Request failed';
    const err = new Error(message) as Error & { status?: number; errors?: unknown[] };
    err.status = res.status;
    err.errors = data.errors;
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url: string) => request<void>(url, { method: 'DELETE' }),
};
