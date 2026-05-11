import { Router } from 'express';
import { getStats, getRevenueChart } from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);
router.get('/stats', getStats);
router.get('/revenue', getRevenueChart);

export default router;
