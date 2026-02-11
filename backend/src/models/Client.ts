import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    billingAddress: { type: String },
  },
  { timestamps: true }
);

clientSchema.index({ userId: 1 });

export const Client = mongoose.model<IClient>('Client', clientSchema);
