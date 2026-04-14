// One-time admin user seed script.
// Run with: npm run seed
// Creates the first admin account. Safe to run multiple times — skips if email exists.

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const SEED_USER = {
  name: 'Admin',
  email: 'admin@insitehealth.com',   // ← change before running
  passwordHash: 'ChangeMe123!',       // ← change before running (min 8 chars)
  role: 'admin',
};

const seed = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000,
    tls: true,
  });
  console.log('Connected to MongoDB.');

  const existing = await User.findOne({ email: SEED_USER.email });
  if (existing) {
    console.log(`Admin user "${SEED_USER.email}" already exists — skipping.`);
    await mongoose.disconnect();
    return;
  }

  const user = await User.create(SEED_USER);
  console.log(`Admin user created: ${user.email} (role: ${user.role})`);
  console.log('IMPORTANT: Change the default password immediately after first login.');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
