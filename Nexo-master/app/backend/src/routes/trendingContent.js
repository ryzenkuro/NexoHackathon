import { Router } from 'express';
import {
  getTrendingContentById,
  getTrendingContents,
} from '../controllers/trendingContentController.js';

const router = Router();

router.get('/', getTrendingContents);
router.get('/search', getTrendingContents);
router.get('/:id', getTrendingContentById);

export default router;
