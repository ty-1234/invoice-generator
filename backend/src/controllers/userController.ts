import { Request, Response } from 'express';
import * as userService from '../services/userService';

export const list = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

  const result = await userService.getUsers(page, limit);
  res.json(result);
};
