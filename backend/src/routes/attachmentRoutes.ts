import { Router } from 'express';
import { param } from 'express-validator';
import * as attachmentController from '../controllers/attachmentController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();
router.use(authenticate);

const invoiceIdParam = [param('invoiceId').isMongoId().withMessage('Invalid invoice ID')];
const idParam = [param('id').isMongoId().withMessage('Invalid attachment ID')];

router.post(
  '/invoices/:invoiceId/attachments',
  validate(invoiceIdParam),
  uploadMiddleware.single('file'),
  attachmentController.upload
);

router.get('/:id', validate(idParam), attachmentController.download);

export default router;
