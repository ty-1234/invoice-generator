import { Router } from 'express';
import { param } from 'express-validator';
import * as paymentController from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

const invoiceIdParam = [param('invoiceId').isMongoId().withMessage('Invalid invoice ID')];

router.post(
  '/invoices/:invoiceId/pay',
  authenticate,
  validate(invoiceIdParam),
  paymentController.createPaymentIntent
);

export default router;
