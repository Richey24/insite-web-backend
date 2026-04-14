import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../utils/cloudinary.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'insite-blog',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, crop: 'limit' }],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// POST /api/upload/image  (author+)
router.post(
  '/image',
  protect,
  requireRole('author'),
  upload.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }
    res.json({
      success: true,
      url: req.file.path,           // Cloudinary secure URL
      publicId: req.file.filename,  // Cloudinary public_id
    });
  }
);

// Multer/Cloudinary error handler for this router
router.use((err, _req, res, _next) => {
  res.status(400).json({ success: false, error: err.message || 'Upload failed.' });
});

export default router;
