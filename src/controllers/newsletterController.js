import Newsletter from '../models/Newsletter.js';

// POST /api/newsletter/subscribe
export const subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required.' });
    }

    const existing = await Newsletter.findOne({ email });

    if (existing) {
      if (existing.active) {
        return res.status(409).json({ success: false, error: 'This email is already subscribed.' });
      }
      // Re-subscribe
      existing.active = true;
      existing.unsubscribedAt = null;
      await existing.save();
      return res.json({ success: true, message: 'Successfully re-subscribed.' });
    }

    const subscriber = await Newsletter.create({ email });
    res.status(201).json({ success: true, data: { email: subscriber.email } });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/newsletter/unsubscribe  (body: { token })
export const unsubscribe = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: 'Unsubscribe token is required.' });
    }

    const subscriber = await Newsletter.findOne({ unsubscribeToken: token });

    if (!subscriber) {
      return res.status(404).json({ success: false, error: 'Invalid or expired unsubscribe token.' });
    }

    subscriber.active = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.json({ success: true, message: 'Successfully unsubscribed.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/newsletter  (admin only)
export const listSubscribers = async (req, res, next) => {
  try {
    const { active, page = 1, limit = 50 } = req.query;
    const filter = active !== undefined ? { active: active === 'true' } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [subscribers, total] = await Promise.all([
      Newsletter.find(filter, '-unsubscribeToken').sort({ subscribedAt: -1 }).skip(skip).limit(Number(limit)),
      Newsletter.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: subscribers,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (err) {
    next(err);
  }
};
