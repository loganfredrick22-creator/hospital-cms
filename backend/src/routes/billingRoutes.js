import { Router } from 'express';
import {
  getBillings,
  getBilling,
  createBilling,
  updateBilling,
  deleteBilling,
} from '../controllers/billingController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', getBillings);
router.get('/:id', getBilling);
router.post('/', authorize('admin', 'receptionist'), createBilling);
router.put('/:id', authorize('admin', 'receptionist'), updateBilling);
router.delete('/:id', authorize('admin'), deleteBilling);

export default router;
