import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const { useQueryMock } = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}));

import Clients from './Clients';

describe('Clients page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state while clients are being fetched', () => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(
      <MemoryRouter>
        <Clients />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders client rows and pagination metadata', () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: [{ _id: 'client-1', name: 'Acme Ltd', email: 'billing@acme.test', phone: '' }],
        meta: {
          page: 1,
          limit: 10,
          total: 12,
          totalPages: 2,
          hasNextPage: true,
          hasPrevPage: false,
        },
      },
    });

    render(
      <MemoryRouter>
        <Clients />
      </MemoryRouter>
    );

    expect(screen.getByText('Acme Ltd')).toBeDefined();
    expect(screen.getByText('billing@acme.test')).toBeDefined();
    expect(screen.getByText('Page 1 of 2 (12 total)')).toBeDefined();
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('renders empty state when no clients exist', () => {
    useQueryMock.mockReturnValue({
      isLoading: false,
      data: {
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    });

    render(
      <MemoryRouter>
        <Clients />
      </MemoryRouter>
    );

    expect(screen.getByText('No clients yet.')).toBeDefined();
    expect(screen.getByText('Add your first client')).toBeDefined();
  });
});
