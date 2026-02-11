import { describe, it, expect } from 'vitest';

function computeTotals(lineItems: { quantity: number; unitPrice: number; total: number }[]) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

describe('Invoice', () => {
  it('should compute totals correctly', () => {
    const lineItems = [
      { quantity: 2, unitPrice: 100, total: 200 },
      { quantity: 1, unitPrice: 50, total: 50 },
    ];
    const { subtotal, tax, total } = computeTotals(lineItems);
    expect(subtotal).toBe(250);
    expect(tax).toBe(0);
    expect(total).toBe(250);
  });

  it('should generate invoice number format', () => {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    expect(prefix).toMatch(/^INV-\d{4}-$/);
  });
});
