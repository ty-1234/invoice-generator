import { Router } from 'express';
import { body, param } from 'express-validator';
import * as clientController from '../controllers/clientController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();
router.use(authenticate);

const createValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('billingAddress').optional().trim(),
];

const updateValidation = [
  param('id').isMongoId().withMessage('Invalid client ID'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phone').optional().trim(),
  body('billingAddress').optional().trim(),
];

const idParam = [param('id').isMongoId().withMessage('Invalid client ID')];

router.post('/', validate(createValidation), clientController.create);
router.get('/', clientController.list);
router.get('/:id', validate(idParam), clientController.getById);
router.patch('/:id', validate(updateValidation), clientController.update);
router.delete('/:id', validate(idParam), clientController.remove);

export default router;
