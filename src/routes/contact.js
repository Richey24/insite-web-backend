import express from 'express';
import { createContact, listContacts } from '../controllers/contactController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.post('/', createContact);

// Admin only
router.get('/', protect, requireRole('admin'), listContacts);

export default router;
