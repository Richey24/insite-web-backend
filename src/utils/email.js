import nodemailer from 'nodemailer';
import ADMIN_NOTIFICATION_EMAILS from '../config/adminEmails.js';

// Create reusable transporter
const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.warn('[Email] SMTP credentials not configured — emails will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: false, // STARTTLS
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
};

const FROM = process.env.EMAIL_FROM || 'InSite Health System <noreply@insitehealth.com>';

// ── Appointment Emails ────────────────────────────────────────────────────────

export const sendAppointmentConfirmation = async (appointment) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const { name, email, appointmentType, preferredDate, preferredTime, organization } = appointment;

  // 1. Admin notification (sent to all addresses in adminEmails.js)
  const adminHtml = `
    <h2>New Appointment Booking</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Phone</td><td style="padding:8px;border:1px solid #ddd">${appointment.phone}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Organization</td><td style="padding:8px;border:1px solid #ddd">${organization || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Service</td><td style="padding:8px;border:1px solid #ddd">${appointmentType}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Preferred Date</td><td style="padding:8px;border:1px solid #ddd">${preferredDate}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Preferred Time</td><td style="padding:8px;border:1px solid #ddd">${preferredTime || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Patient Type</td><td style="padding:8px;border:1px solid #ddd">${appointment.patientType || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Gender</td><td style="padding:8px;border:1px solid #ddd">${appointment.gender || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Department</td><td style="padding:8px;border:1px solid #ddd">${appointment.department || '—'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${appointment.message || '—'}</td></tr>
    </table>
  `;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_NOTIFICATION_EMAILS.join(', '),
    subject: `New Appointment: ${name} — ${appointmentType}`,
    html: adminHtml,
  });

  // 2. User confirmation
  const userHtml = `
    <h2>Your Appointment Request is Confirmed</h2>
    <p>Hi ${name},</p>
    <p>Thank you for booking with InSite Health System. We have received your appointment request and will be in touch shortly to confirm your slot.</p>
    <h3>Booking Summary</h3>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Service</td><td style="padding:8px;border:1px solid #ddd">${appointmentType}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Preferred Date</td><td style="padding:8px;border:1px solid #ddd">${preferredDate}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Preferred Time</td><td style="padding:8px;border:1px solid #ddd">${preferredTime || 'Flexible'}</td></tr>
    </table>
    <p style="margin-top:16px">If you need to make changes, reply to this email or call us directly.</p>
    <p>— The InSite Health System Team</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your Appointment Request — InSite Health System',
    html: userHtml,
  });
};

// ── Contact Form Emails ───────────────────────────────────────────────────────

export const sendContactConfirmation = async (contact) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const { name, email, subject, message } = contact;

  // 1. Admin notification
  const adminHtml = `
    <h2>New Contact Form Submission</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Name</td><td style="padding:8px;border:1px solid #ddd">${name}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Subject</td><td style="padding:8px;border:1px solid #ddd">${subject}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Message</td><td style="padding:8px;border:1px solid #ddd">${message}</td></tr>
    </table>
  `;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_NOTIFICATION_EMAILS.join(', '),
    subject: `New Contact: ${subject} — from ${name}`,
    html: adminHtml,
  });

  // 2. User auto-reply
  const userHtml = `
    <h2>We received your message</h2>
    <p>Hi ${name},</p>
    <p>Thank you for reaching out to InSite Health System. We have received your message and will respond within 1–2 business days.</p>
    <blockquote style="border-left:4px solid #083791;padding-left:16px;color:#555">${message}</blockquote>
    <p>— The InSite Health System Team</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Re: ${subject} — InSite Health System`,
    html: userHtml,
  });
};

// ── Newsletter Emails ─────────────────────────────────────────────────────────

export const sendNewsletterConfirmation = async (email) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const html = `
    <h2>You're subscribed!</h2>
    <p>Thank you for subscribing to the InSite Health System newsletter.</p>
    <p>You'll receive the latest healthcare technology insights, product updates, and industry news straight to your inbox.</p>
    <p style="margin-top:16px">— The InSite Health System Team</p>
    <hr style="margin-top:24px;border:none;border-top:1px solid #eee"/>
    <p style="font-size:12px;color:#999">
      If you did not subscribe, you can safely ignore this email. 
      To unsubscribe, reply with "Unsubscribe" in the subject line.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Welcome to InSite Health System Newsletter',
    html,
  });
};
