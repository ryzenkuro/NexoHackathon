import { Router } from 'express';
import { streamChat } from '../controllers/chatController.js';

const router = Router();

router.post('/', streamChat);

export default router;
