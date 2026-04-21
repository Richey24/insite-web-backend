import nodemailer from 'nodemailer';
import ADMIN_NOTIFICATION_EMAILS from '../config/adminEmails.js';

// ── Transporter ───────────────────────────────────────────────────────────────

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

const FROM = process.env.EMAIL_FROM || 'InSite Health Systems <info@insitehealthsystems.com>';

// ── Shared layout ─────────────────────────────────────────────────────────────
// Wraps any inner HTML in the branded shell.

const layout = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>InSite Health Systems</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(8,55,145,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#083791 0%,#0d4db3 60%,#1870d5 100%);padding:32px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:8px;padding:4px 16px;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">InSite</span>
                <span style="font-size:22px;font-weight:300;color:#18c8ff;letter-spacing:-0.5px;"> Health Systems</span>
              </div>
              <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.65);letter-spacing:1px;text-transform:uppercase;">Healthcare Technology Solutions</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafd;border-top:1px solid #e8eef8;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
                <strong style="color:#083791;">InSite Health Systems</strong>
              </p>
              <p style="margin:0 0 4px;font-size:12px;color:#9ca3af;">2287 Dunlop St. San Diego, CA 92111</p>
              <p style="margin:0 0 12px;font-size:12px;color:#9ca3af;">
                <a href="tel:8583663838" style="color:#083791;text-decoration:none;">(858) 366-3838</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@insitehealthsystems.com" style="color:#083791;text-decoration:none;">info@insitehealthsystems.com</a>
              </p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">&copy; ${new Date().getFullYear()} InSite Health Systems. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// ── Reusable snippets ─────────────────────────────────────────────────────────

const h1 = (text) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#083791;">${text}</h1>`;

const p = (text, extra = '') =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;${extra}">${text}</p>`;

const badge = (text, color = '#083791') =>
  `<span style="display:inline-block;background:${color}1a;color:${color};font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;letter-spacing:0.3px;">${text}</span>`;

const divider = () =>
  `<hr style="border:none;border-top:1px solid #e8eef8;margin:24px 0;" />`;

const ctaButton = (text, href) =>
  `<a href="${href}" style="display:inline-block;background:#083791;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;letter-spacing:0.2px;">${text}</a>`;

const infoTable = (rows) => {
  const cells = rows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:10px 14px;background:#f8fafd;border-bottom:1px solid #e8eef8;font-size:13px;font-weight:600;color:#6b7280;white-space:nowrap;width:38%;">${label}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e8eef8;font-size:14px;color:#1f2937;">${value || '—'}</td>
      </tr>`
    )
    .join('');
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8eef8;border-radius:8px;overflow:hidden;margin:20px 0;">
    <tbody>${cells}</tbody>
  </table>`;
};

const alertBox = (text, color = '#083791') =>
  `<div style="background:${color}0d;border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:14px 16px;margin:20px 0;">
    <p style="margin:0;font-size:14px;color:#1f2937;line-height:1.6;">${text}</p>
  </div>`;

// ── Appointment Emails ────────────────────────────────────────────────────────

export const sendAppointmentConfirmation = async (appointment) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const {
    name, email, phone, organization,
    appointmentType, preferredDate, preferredTime,
    patientType, gender, department, message,
  } = appointment;

  // 1. Admin notification
  const adminBody = `
    ${h1('New Appointment Booking')}
    ${p(`A new appointment request has been submitted via the website.`)}
    ${badge('Action Required', '#FF8E32')}
    ${infoTable([
      ['Name',           name],
      ['Email',          `<a href="mailto:${email}" style="color:#083791;">${email}</a>`],
      ['Phone',          phone],
      ['Organization',   organization],
      ['Service',        appointmentType],
      ['Preferred Date', preferredDate],
      ['Preferred Time', preferredTime || 'Flexible'],
      ['Patient Type',   patientType],
      ['Gender',         gender],
      ['Department',     department],
    ])}
    ${message ? `
      <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
      <div style="background:#f8fafd;border:1px solid #e8eef8;border-radius:8px;padding:14px 16px;font-size:14px;color:#374151;line-height:1.6;">${message}</div>
    ` : ''}
    ${divider()}
    ${p(`Reply directly to this email to contact ${name}.`, 'font-size:13px;color:#9ca3af;')}
  `;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_NOTIFICATION_EMAILS.join(', '),
    replyTo: email,
    subject: `📅 New Appointment: ${name} — ${appointmentType}`,
    html: layout(adminBody),
  });

  // 2. User confirmation
  const userBody = `
    ${h1('Appointment Request Received')}
    ${p(`Hi <strong>${name}</strong>,`)}
    ${p(`Thank you for contacting InSite Health Systems. We have received your appointment request and our team will reach out within <strong>1 business day</strong> to confirm your booking.`)}
    ${alertBox(`Your request for <strong>${appointmentType}</strong> on <strong>${preferredDate}</strong> is under review.`, '#18c8ff')}
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Booking Summary</p>
    ${infoTable([
      ['Service',        appointmentType],
      ['Preferred Date', preferredDate],
      ['Preferred Time', preferredTime || 'Flexible'],
    ])}
    ${divider()}
    ${p(`If you need to make any changes or have questions, don't hesitate to reach out:`)}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding-right:12px;">${ctaButton('Call Us', 'tel:8583663838')}</td>
        <td>${ctaButton('Email Us', 'mailto:info@insitehealthsystems.com')}</td>
      </tr>
    </table>
    ${p(`We look forward to working with you.`, 'color:#6b7280;')}
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: 'Your Appointment Request — InSite Health Systems',
    html: layout(userBody),
  });
};

// ── Contact Form Emails ───────────────────────────────────────────────────────

export const sendContactConfirmation = async (contact) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const { name, email, subject, message } = contact;

  // 1. Admin notification
  const adminBody = `
    ${h1('New Contact Form Message')}
    ${p(`Someone submitted the contact form on the website.`)}
    ${badge('New Message', '#083791')}
    ${infoTable([
      ['Name',    name],
      ['Email',   `<a href="mailto:${email}" style="color:#083791;">${email}</a>`],
      ['Subject', subject],
    ])}
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Message</p>
    <div style="background:#f8fafd;border:1px solid #e8eef8;border-radius:8px;padding:16px;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message}</div>
    ${divider()}
    ${p(`Reply directly to this email to respond to ${name}.`, 'font-size:13px;color:#9ca3af;')}
  `;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_NOTIFICATION_EMAILS.join(', '),
    replyTo: email,
    subject: `💬 Contact: ${subject} — from ${name}`,
    html: layout(adminBody),
  });

  // 2. User auto-reply
  const userBody = `
    ${h1('We received your message')}
    ${p(`Hi <strong>${name}</strong>,`)}
    ${p(`Thank you for reaching out to InSite Health Systems. We have received your message and a member of our team will respond within <strong>1–2 business days</strong>.`)}
    ${alertBox(`Your message regarding <strong>"${subject}"</strong> has been received.`)}
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Your Message</p>
    <div style="background:#f8fafd;border-left:3px solid #e8eef8;border-radius:0 8px 8px 0;padding:14px 16px;font-size:14px;color:#4b5563;line-height:1.7;font-style:italic;margin-bottom:24px;">${message}</div>
    ${divider()}
    ${p(`In the meantime, feel free to browse our services or give us a call:`)}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td style="padding-right:12px;">${ctaButton('Our Services', 'https://insitehealthsystems.com/services')}</td>
        <td>${ctaButton('Call (858) 366-3838', 'tel:8583663838')}</td>
      </tr>
    </table>
  `;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: `Re: ${subject} — InSite Health Systems`,
    html: layout(userBody),
  });
};

// ── Calendly Webhook Emails ───────────────────────────────────────────────────

export const sendCalendlyBookingAlert = async (event) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const {
    eventName, eventType, startTime, endTime,
    location, inviteeName, inviteeEmail,
    cancelUrl, rescheduleUrl, questions,
  } = event;

  const fmt = (d) =>
    d
      ? d.toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
        })
      : 'TBD';

  const questionsHtml = questions?.length
    ? `${divider()}
       <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Invitee Responses</p>
       ${infoTable(questions.map((q) => [q.question, q.answer || '—']))}`
    : '';

  const adminBody = `
    ${h1('New Calendly Booking')}
    ${p('Someone just scheduled a meeting via Calendly.')}
    ${badge('New Booking', '#18c8ff')}
    ${infoTable([
      ['Invitee',     `${inviteeName} &lt;<a href="mailto:${inviteeEmail}" style="color:#083791;">${inviteeEmail}</a>&gt;`],
      ['Event',       eventName || eventType],
      ['Start',       fmt(startTime)],
      ['End',         fmt(endTime)],
      ['Location',    location],
    ])}
    ${questionsHtml}
    ${divider()}
    <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr>
        ${cancelUrl    ? `<td style="padding-right:12px;"><a href="${cancelUrl}" style="display:inline-block;background:#ef44440d;color:#ef4444;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;border:1px solid #ef444433;">Cancel Event</a></td>` : ''}
        ${rescheduleUrl ? `<td><a href="${rescheduleUrl}" style="display:inline-block;background:#083791;color:#ffffff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:8px;text-decoration:none;">Reschedule</a></td>` : ''}
      </tr>
    </table>
    ${p(`Reply directly to this email to contact ${inviteeName}.`, 'font-size:13px;color:#9ca3af;')}
  `;

  await transporter.sendMail({
    from:    FROM,
    to:      ADMIN_NOTIFICATION_EMAILS.join(', '),
    replyTo: inviteeEmail,
    subject: `📅 New Booking: ${inviteeName} — ${fmt(startTime)}`,
    html:    layout(adminBody),
  });
};

export const sendCalendlyCancellationAlert = async (event) => {
  const transporter = createTransporter();
  if (!transporter) return;

  const {
    eventName, startTime,
    inviteeName, inviteeEmail,
    cancelReason, canceledBy,
  } = event;

  const fmt = (d) =>
    d
      ? d.toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
        })
      : 'TBD';

  const adminBody = `
    ${h1('Calendly Booking Cancelled')}
    ${p('A previously scheduled meeting has been cancelled.')}
    ${badge('Cancelled', '#ef4444')}
    ${infoTable([
      ['Invitee',      `${inviteeName} &lt;<a href="mailto:${inviteeEmail}" style="color:#083791;">${inviteeEmail}</a>&gt;`],
      ['Event',        eventName],
      ['Was Scheduled', fmt(startTime)],
      ['Cancelled By', canceledBy || '—'],
      ['Reason',       cancelReason || 'No reason provided'],
    ])}
    ${divider()}
    ${alertBox(`This time slot is now <strong>available again</strong> on your calendar.`, '#18c8ff')}
    ${p(`You may want to follow up with ${inviteeName} to reschedule.`, 'font-size:13px;color:#9ca3af;')}
  `;

  await transporter.sendMail({
    from:    FROM,
    to:      ADMIN_NOTIFICATION_EMAILS.join(', '),
    replyTo: inviteeEmail,
    subject: `❌ Booking Cancelled: ${inviteeName} — ${fmt(startTime)}`,
    html:    layout(adminBody),
  });
};

// ── Newsletter Emails ─────────────────────────────────────────────────────────

export const sendNewsletterConfirmation = async (subscriberEmail) => {
  const transporter = createTransporter();
  if (!transporter) return;

  // 1. Subscriber welcome email
  const subscriberBody = `
    ${h1("You're subscribed!")}
    ${p(`Welcome to the <strong>InSite Health Systems</strong> newsletter.`)}
    ${alertBox(`You'll receive the latest healthcare technology insights, product updates, and industry news — delivered straight to your inbox.`, '#18c8ff')}
    <p style="margin:24px 0 12px;font-size:14px;font-weight:600;color:#1f2937;">What to expect:</p>
    <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
      ${[
        ['🏥', 'Healthcare technology updates',    'The latest innovations in medical asset tracking and mobile security.'],
        ['📊', 'Industry insights',                'Compliance news, regulatory changes, and best practices.'],
        ['🔔', 'Product announcements',            'New features and improvements to InSite Health Systems solutions.'],
      ].map(([icon, title, desc]) => `
        <tr>
          <td style="width:36px;vertical-align:top;padding:0 12px 16px 0;font-size:20px;">${icon}</td>
          <td style="vertical-align:top;padding-bottom:16px;">
            <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#1f2937;">${title}</p>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">${desc}</p>
          </td>
        </tr>
      `).join('')}
    </table>
    ${divider()}
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-align:center;">
      Subscribed by mistake? 
      <a href="mailto:info@insitehealthsystems.com?subject=Unsubscribe&body=Please unsubscribe ${subscriberEmail} from your newsletter." style="color:#083791;">Click here to unsubscribe</a>.
    </p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: subscriberEmail,
    subject: 'Welcome to InSite Health Systems Newsletter',
    html: layout(subscriberBody),
  });

  // 2. Admin notification of new subscriber
  const adminBody = `
    ${h1('New Newsletter Subscriber')}
    ${p(`A new subscriber has joined the InSite Health Systems newsletter.`)}
    ${infoTable([
      ['Email',     subscriberEmail],
      ['Subscribed', new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })],
    ])}
  `;

  await transporter.sendMail({
    from: FROM,
    to: ADMIN_NOTIFICATION_EMAILS.join(', '),
    subject: `📧 New Newsletter Subscriber: ${subscriberEmail}`,
    html: layout(adminBody),
  });
};
