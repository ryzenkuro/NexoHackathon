import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notificationController.js';

const router = Router();

router.get('/', getNotifications);
router.post('/read', markAsRead);
router.post('/read-all', markAllRead);

export default router;
