import { Request, Response } from 'express';
import * as stripeService from '../services/stripeService';

export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  const result = await stripeService.createPaymentIntent(req.params.invoiceId);
  res.json(result);
};
