import { Request, Response } from 'express';
import * as clientService from '../services/clientService';

export const create = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const client = await clientService.createClient(req.user._id.toString(), req.body);
  res.status(201).json(client);
};

export const list = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const result = await clientService.getClients(req.user, page, limit);
  res.json(result);
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const client = await clientService.getClientById(req.params.id, req.user);
  res.json(client);
};

export const update = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const client = await clientService.updateClient(req.params.id, req.user, req.body);
  res.json(client);
};

export const remove = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  await clientService.deleteClient(req.params.id, req.user);
  res.status(204).send();
};
