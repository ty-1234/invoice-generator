import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}));

import Dashboard from './Dashboard';

describe('Dashboard page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders totals and recent records when query data exists', () => {
    useQueryMock.mockImplementation(({ queryKey }: { queryKey: unknown[] }) => {
      if (queryKey[0] === 'invoices') {
        return {
          data: {
            meta: { total: 2 },
            data: [{ _id: 'inv-1', number: 'INV-2026-0001', total: 150, status: 'draft' }],
          },
        };
      }
      if (queryKey[0] === 'clients') {
        return {
          data: {
            meta: { total: 1 },
            data: [{ _id: 'client-1', name: 'Acme Ltd', email: 'billing@acme.test' }],
          },
        };
      }
      return { data: undefined };
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('INV-2026-0001')).toBeDefined();
    expect(screen.getByText('Acme Ltd')).toBeDefined();
    expect(screen.getByText('billing@acme.test')).toBeDefined();
    expect(screen.queryByText('No invoices yet')).toBeNull();
    expect(screen.queryByText('No clients yet')).toBeNull();
  });

  it('shows empty-state text when no recent records exist', () => {
    useQueryMock.mockReturnValue({
      data: { meta: { total: 0 }, data: [] },
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    );

    expect(screen.getByText('No invoices yet')).toBeDefined();
    expect(screen.getByText('No clients yet')).toBeDefined();
  });
});
