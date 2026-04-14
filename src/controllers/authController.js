import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: user.toJSON(), // passwordHash stripped via toJSON()
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected)
export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// POST /api/auth/logout  (protected)
// JWT is stateless — client drops the token. Server acknowledges.
export const logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
};

// POST /api/auth/change-password  (protected)
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'New password must be at least 8 characters.' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/users  (editor+)
export const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/users  (admin only)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters.' });
    }

    const VALID_ROLES = ['admin', 'editor', 'author'];
    const assignedRole = VALID_ROLES.includes(role) ? role : 'author';

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, error: 'A user with this email already exists.' });
    }

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook will hash it
      role: assignedRole,
    });

    res.status(201).json({ success: true, data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};
