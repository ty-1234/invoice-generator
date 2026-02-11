import { Request, Response } from 'express';
import * as stripeService from '../services/stripeService';

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    res.status(400).json({ message: 'Missing stripe-signature header' });
    return;
  }

  try {
    await stripeService.handleWebhook(req.body, signature);
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(400).json({ message: err instanceof Error ? err.message : 'Webhook error' });
  }
};
