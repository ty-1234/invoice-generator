import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Simple component for testing
function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    draft: 'bg-slate-100',
    paid: 'bg-green-100',
  };
  return <span className={classes[status] ?? 'bg-slate-100'}>{status}</span>;
}

describe('StatusBadge', () => {
  it('renders status correctly', () => {
    render(<StatusBadge status="draft" />);
    expect(screen.getByText('draft')).toBeDefined();
  });

  it('renders paid status', () => {
    render(<StatusBadge status="paid" />);
    expect(screen.getByText('paid')).toBeDefined();
  });
});
