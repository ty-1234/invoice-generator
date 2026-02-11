import mongoose, { Document, Schema } from 'mongoose';

export interface IAttachment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  createdAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    storageKey: { type: String, required: true },
  },
  { timestamps: true }
);

attachmentSchema.index({ invoiceId: 1 });

export const Attachment = mongoose.model<IAttachment>('Attachment', attachmentSchema);
