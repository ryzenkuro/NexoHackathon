import { Router } from 'express';
import { getTrends, getTrendById, searchTrends } from '../controllers/trendController.js';

const router = Router();

router.get('/', getTrends);
router.get('/search', searchTrends);
router.get('/:id', getTrendById);

export default router;
