import Contact from '../models/Contact.js';
import { sendContactConfirmation } from '../utils/email.js';

// POST /api/contact
export const createContact = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'name, email, subject, and message are required.',
      });
    }

    const contact = await Contact.create({ name, email, subject, message });

    // Send confirmation emails (fire and forget)
    sendContactConfirmation(contact).catch((err) =>
      console.error('Email send failed:', err.message)
    );

    res.status(201).json({ success: true, data: contact });
  } catch (err) {
    next(err);
  }
};

// GET /api/contact  (admin only)
export const listContacts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [contacts, total] = await Promise.all([
      Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Contact.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
};
