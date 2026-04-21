import express from 'express';
import { handleWebhook, sendTestEmail } from '../controllers/calendlyController.js';

const router = express.Router();

// ── Calendly Webhook ──────────────────────────────────────────────────────────
// IMPORTANT: This route uses express.raw() so we can access req.rawBody for
// HMAC-SHA256 signature verification. It must NOT use express.json() middleware
// because that consumes the buffer before we can hash it.

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    // Attach raw body string for signature verification in the controller
    req.rawBody = req.body.toString('utf8');
    next();
  },
  handleWebhook
);

// ── Test endpoint (dev/staging only) ─────────────────────────────────────────
// POST /api/calendly/test-email?type=booking
// POST /api/calendly/test-email?type=cancellation
router.post('/test-email', sendTestEmail);

export default router;
