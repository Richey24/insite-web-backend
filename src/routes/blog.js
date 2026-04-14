import express from 'express';
import {
  listPosts,
  getPostBySlug,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  addComment,
  getComments,
} from '../controllers/blogController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public
router.get('/posts', listPosts);
router.get('/posts/id/:id', protect, getPostById);   // must be before /:slug
router.get('/posts/:slug', getPostBySlug);
router.get('/posts/:slug/comments', getComments);
router.post('/posts/:slug/comments', addComment);

// Protected
router.post('/posts', protect, requireRole('author'), createPost);
router.put('/posts/:id', protect, requireRole('author'), updatePost);
router.delete('/posts/:id', protect, requireRole('admin'), deletePost);

export default router;
