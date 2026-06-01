import { Router } from 'express';
import {
  chatWithNexo,
  generateChatWelcome,
  generateContentAnalysis,
  generateDashboardInsight,
  generateTrendRecommendation,
  getAiHealth,
  getAiLakehouseSummary,
  getAiRuns,
} from '../controllers/aiController.js';

const router = Router();

router.get('/health', getAiHealth);
router.post('/insights/dashboard', generateDashboardInsight);
router.get('/trends/:id/recommendation', generateTrendRecommendation);
router.get('/trends/:id/welcome', generateChatWelcome);
router.get('/content/:id/analysis', generateContentAnalysis);
router.post('/chat', chatWithNexo);
router.get('/runs', getAiRuns);
router.get('/lakehouse/summary', getAiLakehouseSummary);

export default router;
