import express from 'express';
import {
  subscribe,
  unsubscribe,
  listSubscribers,
} from '../controllers/newsletterController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/subscribe', subscribe);
router.delete('/unsubscribe', unsubscribe);

// Admin only
router.get('/', protect, requireRole('admin'), listSubscribers);

export default router;
