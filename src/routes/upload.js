import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Store file in memory so we can stream it to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
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
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided.' });
    }

    try {
      // Stream the buffer to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'insite-blog',
            transformation: [{ width: 1200, crop: 'limit' }],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      res.json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      });
    } catch (err) {
      console.error('[upload] Cloudinary error:', err);
      res.status(500).json({ success: false, error: err.message || 'Upload failed.' });
    }
  }
);

// Multer error handler for this router
router.use((err, _req, res, _next) => {
  res.status(400).json({ success: false, error: err.message || 'Upload failed.' });
});

export default router;
