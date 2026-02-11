import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  provider: string;
  providerPaymentId: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: Date;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    provider: { type: String, required: true, default: 'stripe' },
    providerPaymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, required: true },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

paymentSchema.index({ invoiceId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
