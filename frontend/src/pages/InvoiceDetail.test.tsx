import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const { useQueryMock, useMutationMock, useQueryClientMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
  },
}));

import InvoiceDetail from './InvoiceDetail';

function renderWithRoute(path = '/invoices/inv-1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('InvoiceDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({ invalidateQueries: vi.fn() });
    useMutationMock.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it('shows loading state when invoice query is pending', () => {
    useQueryMock.mockReturnValue({ isLoading: true, data: undefined });

    renderWithRoute();

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders invoice details and shows delete action for unpaid invoices', () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        _id: 'inv-1',
        number: 'INV-2026-0001',
        status: 'draft',
        clientId: { _id: 'client-1', name: 'Acme Ltd', email: 'billing@acme.test' },
        issueDate: '2026-03-01T00:00:00.000Z',
        dueDate: '2026-03-31T00:00:00.000Z',
        currency: 'USD',
        subtotal: 200,
        tax: 0,
        total: 200,
        notes: 'Please pay within 30 days.',
        terms: 'Net 30',
        lineItems: [{ description: 'Design', quantity: 2, unitPrice: 100, total: 200 }],
      },
    });

    renderWithRoute();

    expect(screen.getByText('INV-2026-0001')).toBeDefined();
    expect(screen.getByText('Acme Ltd')).toBeDefined();
    expect(screen.getByText('billing@acme.test')).toBeDefined();
    expect(screen.getByText('Total: USD 200.00')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined();
  });

  it('hides delete action for paid invoices', () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        _id: 'inv-1',
        number: 'INV-2026-0002',
        status: 'paid',
        clientId: { _id: 'client-1', name: 'Acme Ltd', email: 'billing@acme.test' },
        issueDate: '2026-03-01T00:00:00.000Z',
        dueDate: '2026-03-31T00:00:00.000Z',
        currency: 'USD',
        subtotal: 100,
        tax: 0,
        total: 100,
        lineItems: [{ description: 'Consulting', quantity: 1, unitPrice: 100, total: 100 }],
      },
    });

    renderWithRoute();

    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull();
  });
});
