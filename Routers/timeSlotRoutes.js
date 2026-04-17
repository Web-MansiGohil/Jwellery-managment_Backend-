import express from 'express';
import {
    createTimeSlot,
    getTimeSlotsByDate,
    deleteTimeSlot,
    getAllTimeSlots,
    updateTimeSlot
} from '../controllers/timeSlotController.js';
import { adminOnly, tokenVerify } from '../Middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/:date', getTimeSlotsByDate);

// Admin only routes
router.post('/add', tokenVerify, adminOnly, createTimeSlot);
router.get('/all/list', tokenVerify, adminOnly, getAllTimeSlots);
router.put('/update/:id', tokenVerify, adminOnly, updateTimeSlot);
router.delete('/delete/:id', tokenVerify, adminOnly, deleteTimeSlot);

export default router;
