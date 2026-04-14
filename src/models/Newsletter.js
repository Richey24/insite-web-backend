import mongoose from 'mongoose';
import crypto from 'crypto';

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
    unsubscribeToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(32).toString('hex'),
    },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'subscribedAt', updatedAt: false } }
);

const Newsletter = mongoose.model('Newsletter', newsletterSchema);
export default Newsletter;
