import express from 'express';
import { createAppointment, listAppointments } from '../controllers/appointmentController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/', createAppointment);

// Admin only
router.get('/', protect, requireRole('admin'), listAppointments);

export default router;
