import { Request, Response } from 'express';
import { Attachment } from '../models/Attachment';
import { Invoice } from '../models/Invoice';
import * as storageService from '../services/storageService';
import { AppError } from '../middleware/errorHandler';

export const upload = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }

  const invoiceId = req.params.invoiceId;
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }
  if (invoice.userId.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const saved = await storageService.saveFile(req.file, invoiceId);

  const attachment = await Attachment.create({
    invoiceId,
    fileName: saved.fileName,
    fileSize: saved.fileSize,
    mimeType: saved.mimeType,
    storageKey: saved.storageKey,
  });

  res.status(201).json(attachment);
};

export const download = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const attachment = await Attachment.findById(req.params.id).populate('invoiceId');
  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }

  const invoice = attachment.invoiceId as unknown as { userId: { toString: () => string } };
  if (invoice.userId?.toString() !== req.user._id.toString()) {
    throw new AppError('Access denied', 403);
  }

  const stream = storageService.getFileStream(attachment.storageKey);
  res.setHeader('Content-Type', attachment.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
  stream.pipe(res);
};
