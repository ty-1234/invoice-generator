import mongoose, { Document, Schema } from 'mongoose';

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface ILineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  number: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  terms?: string;
  lineItems: ILineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const lineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: true }
);

const invoiceSchema = new Schema<IInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    number: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
      default: 'draft',
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    currency: { type: String, default: 'USD' },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
    terms: { type: String },
    lineItems: [lineItemSchema],
  },
  { timestamps: true }
);

invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ clientId: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ userId: 1, number: 1 }, { unique: true });

export const Invoice = mongoose.model<IInvoice>('Invoice', invoiceSchema);
