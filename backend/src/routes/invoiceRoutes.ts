import { Router } from 'express';
import { body, param } from 'express-validator';
import * as invoiceController from '../controllers/invoiceController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const lineItemValidation = [
  body('description').trim().notEmpty().withMessage('Description required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be positive'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
];

const createValidation = [
  body('clientId').isMongoId().withMessage('Invalid client ID'),
  body('issueDate').isISO8601().withMessage('Valid issue date required'),
  body('dueDate').isISO8601().withMessage('Valid due date required'),
  body('currency').optional().isString().trim(),
  body('notes').optional().trim(),
  body('terms').optional().trim(),
  body('lineItems').isArray({ min: 1 }).withMessage('At least one line item required'),
  body('lineItems.*').custom((item) => {
    if (!item.description || item.quantity == null || item.unitPrice == null) {
      throw new Error('Each line item needs description, quantity, unitPrice');
    }
    return true;
  }),
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid invoice ID'),
  body('clientId').optional().isMongoId().withMessage('Invalid client ID'),
  body('issueDate').optional().isISO8601().withMessage('Valid issue date required'),
  body('dueDate').optional().isISO8601().withMessage('Valid due date required'),
  body('currency').optional().isString().trim(),
  body('notes').optional().trim(),
  body('terms').optional().trim(),
  body('lineItems').optional().isArray({ min: 1 }).withMessage('At least one line item required'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid invoice ID')];

router.post('/', validate(createValidation), invoiceController.create);
router.get('/', invoiceController.list);
router.get('/:id', validate(idParam), invoiceController.getById);
router.patch('/:id', validate(updateValidation), invoiceController.update);
router.delete('/:id', validate(idParam), invoiceController.remove);

export default router;
