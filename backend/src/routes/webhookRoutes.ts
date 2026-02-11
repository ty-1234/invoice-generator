import { Router } from 'express';
import * as webhookController from '../controllers/webhookController';

const router = Router();

// Stripe webhook requires raw body - must be registered before express.json()
router.post('/stripe', webhookController.stripeWebhook);

export default router;
