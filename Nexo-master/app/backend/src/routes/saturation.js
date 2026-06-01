import { Router } from 'express';
import {
  getSaturationSummary,
  getSaturationTrend,
  streamSaturationTrend,
} from '../controllers/saturationController.js';

const router = Router();

router.get('/summary', getSaturationSummary);
router.get('/trends/:id', getSaturationTrend);
router.get('/trends/:id/stream', streamSaturationTrend);

export default router;
