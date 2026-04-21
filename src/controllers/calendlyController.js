import crypto from 'crypto';
import { sendCalendlyBookingAlert, sendCalendlyCancellationAlert } from '../utils/email.js';

// ── Signature verification ────────────────────────────────────────────────────
// Calendly signs every webhook payload with HMAC-SHA256 using your signing key.
// The signature is sent in the `Calendly-Webhook-Signature` header as:
//   t=<timestamp>,v1=<hex-digest>
// We reconstruct the signed string as `<timestamp>.<rawBody>` and compare.

const verifySignature = (req) => {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;

  // If no secret is configured we skip verification (dev mode warning only)
  if (!secret) {
    console.warn('[Calendly] CALENDLY_WEBHOOK_SECRET not set — skipping signature verification.');
    return true;
  }

  const header = req.headers['calendly-webhook-signature'];
  if (!header) return false;

  // Parse t=... v1=...
  const parts = Object.fromEntries(header.split(',').map((s) => s.split('=')));
  const timestamp = parts['t'];
  const receivedSig = parts['v1'];
  if (!timestamp || !receivedSig) return false;

  // Reject payloads older than 5 minutes (replay attack prevention)
  const age = Date.now() - Number(timestamp) * 1000;
  if (age > 5 * 60 * 1000) return false;

  const rawBody = req.rawBody; // populated by express.raw() in the route
  const signed = `${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(signed, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSig));
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const parseEvent = (body) => {
  // Calendly v2 webhook payload shape
  const event = body?.payload?.event || body?.event || {};
  const invitee = body?.payload?.invitee || body?.invitee || {};
  const tracking = body?.payload?.tracking || {};

  const startTime = event.start_time || event.startTime;
  const endTime = event.end_time || event.endTime;

  return {
    eventName:       event.name || event.title || 'Consultation',
    eventType:       body?.event_type || body?.payload?.event_type?.name || '',
    startTime:       startTime ? new Date(startTime) : null,
    endTime:         endTime   ? new Date(endTime)   : null,
    location:        event.location?.location || event.location || 'To be confirmed',
    inviteeName:     invitee.name || 'Unknown',
    inviteeEmail:    invitee.email || '',
    cancelUrl:       invitee.cancel_url || invitee.cancelUrl || '',
    rescheduleUrl:   invitee.reschedule_url || invitee.rescheduleUrl || '',
    cancelReason:    body?.payload?.cancellation?.reason || body?.cancellation?.reason || '',
    canceledBy:      body?.payload?.cancellation?.canceled_by || body?.cancellation?.canceled_by || '',
    utmSource:       tracking.utm_source || '',
    questions:       invitee.questions_and_answers || [],
  };
};

const formatDateTime = (date) => {
  if (!date) return 'TBD';
  return date.toLocaleString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
    timeZoneName: 'short',
  });
};

// ── Main webhook handler ──────────────────────────────────────────────────────

export const handleWebhook = async (req, res) => {
  // Always respond 200 fast — Calendly retries on non-2xx
  if (!verifySignature(req)) {
    console.warn('[Calendly] Webhook signature verification failed.');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let body;
  try {
    body = JSON.parse(req.rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const eventType = body?.event || body?.payload?.event;
  console.log(`[Calendly] Received event: ${eventType}`);

  // Respond immediately — process email async so Calendly doesn't time out
  res.status(200).json({ received: true });

  const parsed = parseEvent(body);

  if (eventType === 'invitee.created') {
    sendCalendlyBookingAlert(parsed).catch((err) =>
      console.error('[Calendly] Failed to send booking alert:', err)
    );
  } else if (eventType === 'invitee.canceled') {
    sendCalendlyCancellationAlert(parsed).catch((err) =>
      console.error('[Calendly] Failed to send cancellation alert:', err)
    );
  }
  // invitee.no_show, routing_form_submission.created, etc. — ignored for now
};

// ── Test endpoint (dev only) ──────────────────────────────────────────────────
// POST /api/calendly/test-email?type=booking|cancellation
// Fires a test email without needing a real Calendly event.

export const sendTestEmail = async (req, res) => {
  const type = req.query.type || 'booking';

  const mockEvent = {
    eventName:     'Free Pilot Consultation',
    eventType:     'InSite Health Systems — 30 Min Demo',
    startTime:     new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
    endTime:       new Date(Date.now() + 48 * 60 * 60 * 1000 + 30 * 60 * 1000),
    location:      'Zoom (link sent via email)',
    inviteeName:   'Test User',
    inviteeEmail:  'testuser@example.com',
    cancelUrl:     'https://calendly.com/cancellations/test-uuid',
    rescheduleUrl: 'https://calendly.com/reschedulings/test-uuid',
    cancelReason:  type === 'cancellation' ? 'Schedule conflict' : '',
    canceledBy:    type === 'cancellation' ? 'Test User' : '',
    questions:     [{ question: 'How did you hear about us?', answer: 'Google' }],
  };

  try {
    if (type === 'cancellation') {
      await sendCalendlyCancellationAlert(mockEvent);
    } else {
      await sendCalendlyBookingAlert(mockEvent);
    }
    res.json({ success: true, message: `Test ${type} email sent to admin.` });
  } catch (err) {
    console.error('[Calendly] Test email error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
