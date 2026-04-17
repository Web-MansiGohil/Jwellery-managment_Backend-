import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { tokenVerify } from '../Middleware/authMiddleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(tokenVerify);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);

export default router;
