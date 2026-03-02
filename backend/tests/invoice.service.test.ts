import mongoose from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/middleware/errorHandler';

const {
  clientFindByIdMock,
  invoiceFindOneMock,
  invoiceCreateMock,
  invoiceFindByIdMock,
} = vi.hoisted(() => ({
  clientFindByIdMock: vi.fn(),
  invoiceFindOneMock: vi.fn(),
  invoiceCreateMock: vi.fn(),
  invoiceFindByIdMock: vi.fn(),
}));

vi.mock('../src/models/Client', () => ({
  Client: {
    findById: clientFindByIdMock,
  },
}));

vi.mock('../src/models/Invoice', () => ({
  Invoice: {
    findOne: invoiceFindOneMock,
    create: invoiceCreateMock,
    findById: invoiceFindByIdMock,
  },
}));

import { createInvoice, getInvoiceById, updateInvoice } from '../src/services/invoiceService';

function mockLatestInvoiceNumber(number?: string) {
  const leanMock = vi.fn().mockResolvedValue(number ? { number } : null);
  const selectMock = vi.fn().mockReturnValue({ lean: leanMock });
  const sortMock = vi.fn().mockReturnValue({ select: selectMock });
  invoiceFindOneMock.mockReturnValue({ sort: sortMock });
}

describe('invoiceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws 404 when creating invoice for unknown client', async () => {
    clientFindByIdMock.mockResolvedValue(null);

    await expect(
      createInvoice('user-1', {
        clientId: 'client-1',
        issueDate: '2026-03-01',
        dueDate: '2026-03-31',
        lineItems: [{ description: 'Work', quantity: 1, unitPrice: 100 }],
      })
    ).rejects.toMatchObject<AppError>({ message: 'Client not found', statusCode: 404 });
  });

  it('throws 404 when creating invoice for client owned by another user', async () => {
    clientFindByIdMock.mockResolvedValue({
      userId: { toString: () => 'other-user' },
    });

    await expect(
      createInvoice('user-1', {
        clientId: 'client-1',
        issueDate: '2026-03-01',
        dueDate: '2026-03-31',
        lineItems: [{ description: 'Work', quantity: 1, unitPrice: 100 }],
      })
    ).rejects.toMatchObject<AppError>({ message: 'Client not found', statusCode: 404 });
  });

  it('computes totals, trims text fields, and creates next invoice number', async () => {
    const year = new Date().getFullYear();
    const userId = new mongoose.Types.ObjectId().toString();
    clientFindByIdMock.mockResolvedValue({
      userId: { toString: () => userId },
    });
    mockLatestInvoiceNumber(`INV-${year}-0007`);
    invoiceCreateMock.mockResolvedValue({ _id: 'invoice-1' });

    await createInvoice(userId, {
      clientId: new mongoose.Types.ObjectId().toString(),
      issueDate: '2026-03-01',
      dueDate: '2026-03-31',
      notes: '  note text  ',
      terms: '  net 30  ',
      lineItems: [
        { description: '  Design work  ', quantity: 2, unitPrice: 100 },
        { description: ' Hosting ', quantity: 1, unitPrice: 50 },
      ],
    });

    expect(invoiceCreateMock).toHaveBeenCalledTimes(1);
    const payload = invoiceCreateMock.mock.calls[0][0];
    expect(payload.number).toBe(`INV-${year}-0008`);
    expect(payload.currency).toBe('USD');
    expect(payload.subtotal).toBe(250);
    expect(payload.tax).toBe(0);
    expect(payload.total).toBe(250);
    expect(payload.notes).toBe('note text');
    expect(payload.terms).toBe('net 30');
    expect(payload.lineItems).toEqual([
      { description: 'Design work', quantity: 2, unitPrice: 100, total: 200 },
      { description: 'Hosting', quantity: 1, unitPrice: 50, total: 50 },
    ]);
  });

  it('throws 403 when non-admin tries to read another user invoice', async () => {
    invoiceFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        userId: { toString: () => 'owner-user' },
      }),
    });

    await expect(
      getInvoiceById('invoice-1', { role: 'user', _id: 'different-user' } as any)
    ).rejects.toMatchObject<AppError>({ message: 'Access denied', statusCode: 403 });
  });

  it('recalculates totals and saves on line item updates', async () => {
    const saveMock = vi.fn().mockResolvedValue(undefined);
    const invoiceDoc = {
      userId: { toString: () => 'user-1' },
      lineItems: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      notes: '',
      terms: '',
      save: saveMock,
    };

    invoiceFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue(invoiceDoc),
    });

    await updateInvoice('invoice-1', { role: 'user', _id: 'user-1' } as any, {
      notes: '  updated note  ',
      lineItems: [
        { description: '  API development ', quantity: 3, unitPrice: 120 },
        { description: ' Support', quantity: 2, unitPrice: 40 },
      ],
    });

    expect(invoiceDoc.lineItems).toEqual([
      { description: 'API development', quantity: 3, unitPrice: 120, total: 360 },
      { description: 'Support', quantity: 2, unitPrice: 40, total: 80 },
    ]);
    expect(invoiceDoc.subtotal).toBe(440);
    expect(invoiceDoc.tax).toBe(0);
    expect(invoiceDoc.total).toBe(440);
    expect(invoiceDoc.notes).toBe('updated note');
    expect(saveMock).toHaveBeenCalledTimes(1);
  });
});
