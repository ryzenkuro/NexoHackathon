import { Router } from 'express';
import { streamChat } from '../controllers/chatController.js';
import { verifyToken } from '../controllers/authController.js';

const router = Router();

router.post('/', verifyToken, streamChat);

export default router;
