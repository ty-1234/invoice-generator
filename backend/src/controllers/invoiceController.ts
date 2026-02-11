import { Request, Response } from 'express';
import * as invoiceService from '../services/invoiceService';

export const create = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const invoice = await invoiceService.createInvoice(req.user._id.toString(), req.body);
  res.status(201).json(invoice);
};

export const list = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const filters: { status?: string; clientId?: string } = {};
  if (req.query.status && typeof req.query.status === 'string') filters.status = req.query.status;
  if (req.query.clientId && typeof req.query.clientId === 'string') filters.clientId = req.query.clientId;

  const result = await invoiceService.getInvoices(req.user, page, limit, filters);
  res.json(result);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const invoice = await invoiceService.getInvoiceById(req.params.id, req.user);
  res.json(invoice);
};

export const update = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const invoice = await invoiceService.updateInvoice(req.params.id, req.user, req.body);
  res.json(invoice);
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  await invoiceService.deleteInvoice(req.params.id, req.user);
  res.status(204).send();
};
