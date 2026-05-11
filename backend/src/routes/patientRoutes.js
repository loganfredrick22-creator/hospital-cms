import { Router } from 'express';
import {
  getPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', getPatients);
router.get('/:id', getPatient);
router.post('/', authorize('admin', 'receptionist'), createPatient);
router.put('/:id', authorize('admin', 'receptionist', 'doctor'), updatePatient);
router.delete('/:id', authorize('admin'), deletePatient);

export default router;
