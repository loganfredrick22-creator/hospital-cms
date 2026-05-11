import { Router } from 'express';
import {
  getPrescriptions,
  getPrescription,
  createPrescription,
  updatePrescription,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', getPrescriptions);
router.get('/:id', getPrescription);
router.post('/', authorize('admin', 'doctor'), createPrescription);
router.put('/:id', authorize('admin', 'doctor'), updatePrescription);
router.delete('/:id', authorize('admin'), deletePrescription);

export default router;
