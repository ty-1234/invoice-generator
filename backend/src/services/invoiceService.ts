import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice';
import { Client } from '../models/Client';
import { AppError } from '../middleware/errorHandler';
import { IUser } from '../models/User';
import { ILineItem } from '../models/Invoice';

export interface CreateInvoiceInput {
  clientId: string;
  issueDate: string;
  dueDate: string;
  currency?: string;
  notes?: string;
  terms?: string;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

function computeTotals(lineItems: ILineItem[]): { subtotal: number; tax: number; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const tax = 0;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

async function getNextInvoiceNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await Invoice.findOne({ userId, number: new RegExp(`^${prefix}`) })
    .sort({ number: -1 })
    .select('number')
    .lean();

  let seq = 1;
  if (last?.number) {
    const match = last.number.match(/-(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }

  return `${prefix}${seq.toString().padStart(4, '0')}`;
}

export const createInvoice = async (userId: string, input: CreateInvoiceInput) => {
  const client = await Client.findById(input.clientId);
  if (!client) {
    throw new AppError('Client not found', 404);
  }
  if (client.userId.toString() !== userId) {
    throw new AppError('Client not found', 404);
  }

  const lineItems: ILineItem[] = input.lineItems.map((item) => ({
    description: item.description.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.quantity * item.unitPrice,
  }));

  const { subtotal, tax, total } = computeTotals(lineItems);
  const number = await getNextInvoiceNumber(userId);

  return Invoice.create({
    userId: new mongoose.Types.ObjectId(userId),
    clientId: new mongoose.Types.ObjectId(input.clientId),
    number,
    status: 'draft',
    issueDate: new Date(input.issueDate),
    dueDate: new Date(input.dueDate),
    currency: input.currency || 'USD',
    subtotal,
    tax,
    total,
    notes: input.notes?.trim(),
    terms: input.terms?.trim(),
    lineItems,
  });
};

export const getInvoices = async (
  user: IUser,
  page = 1,
  limit = 20,
  filters?: { status?: string; clientId?: string }
): Promise<PaginatedResult<unknown>> => {
  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = user.role === 'admin' ? {} : { userId: user._id };
  if (filters?.status) filter.status = filters.status;
  if (filters?.clientId) filter.clientId = new mongoose.Types.ObjectId(filters.clientId);

  const [data, total] = await Promise.all([
    Invoice.find(filter)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getInvoiceById = async (invoiceId: string, user: IUser) => {
  const invoice = await Invoice.findById(invoiceId).populate('clientId');
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  if (user.role !== 'admin' && invoice.userId.toString() !== user._id.toString()) {
    throw new AppError('Access denied', 403);
  }
  return invoice;
};

export const updateInvoice = async (invoiceId: string, user: IUser, input: UpdateInvoiceInput) => {
  const invoice = await getInvoiceById(invoiceId, user);

  if (input.lineItems?.length) {
    invoice.lineItems = input.lineItems.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));
    const { subtotal, tax, total } = computeTotals(invoice.lineItems);
    invoice.subtotal = subtotal;
    invoice.tax = tax;
    invoice.total = total;
  }

  Object.assign(invoice, {
    ...(input.clientId && { clientId: new mongoose.Types.ObjectId(input.clientId) }),
    ...(input.issueDate && { issueDate: new Date(input.issueDate) }),
    ...(input.dueDate && { dueDate: new Date(input.dueDate) }),
    ...(input.currency && { currency: input.currency }),
    ...(input.notes !== undefined && { notes: input.notes?.trim() }),
    ...(input.terms !== undefined && { terms: input.terms?.trim() }),
  });

  await invoice.save();
  return invoice;
};

export const deleteInvoice = async (invoiceId: string, user: IUser) => {
  const invoice = await getInvoiceById(invoiceId, user);
  await Invoice.deleteOne({ _id: invoice._id });
};
