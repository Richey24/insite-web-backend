import express from 'express';
import {
  listPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/blogController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/posts', listPosts);
router.get('/posts/:slug', getPostBySlug);

// Protected
router.post('/posts', protect, requireRole('author'), createPost);
router.put('/posts/:id', protect, requireRole('author'), updatePost);
router.delete('/posts/:id', protect, requireRole('admin'), deletePost);

export default router;
