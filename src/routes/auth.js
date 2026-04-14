import express from 'express';
import { login, getMe, logout, changePassword, listUsers, createUser } from '../controllers/authController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/change-password', protect, changePassword);
router.get('/users', protect, requireRole('editor'), listUsers);
router.post('/users', protect, requireRole('admin'), createUser);

export default router;
