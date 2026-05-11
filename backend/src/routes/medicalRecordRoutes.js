import { Router } from 'express';
import {
  getMedicalRecords,
  getMedicalRecord,
  createMedicalRecord,
  updateMedicalRecord,
  deleteMedicalRecord,
} from '../controllers/medicalRecordController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/', getMedicalRecords);
router.get('/:id', getMedicalRecord);
router.post('/', authorize('admin', 'doctor'), createMedicalRecord);
router.put('/:id', authorize('admin', 'doctor'), updateMedicalRecord);
router.delete('/:id', authorize('admin'), deleteMedicalRecord);

export default router;
