import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireRole('admin'), userController.list);

export default router;
