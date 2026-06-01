import { Router } from 'express';
import {
  getDashboardRealtime,
  getDashboardStreamStatus,
  streamDashboardRealtime,
} from '../controllers/dashboardController.js';

const router = Router();

router.get('/realtime', getDashboardRealtime);
router.get('/realtime/stream', streamDashboardRealtime);
router.get('/realtime/status', getDashboardStreamStatus);

export default router;
