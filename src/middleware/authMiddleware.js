import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const ROLE_HIERARCHY = { author: 1, editor: 2, admin: 3 };

// Verify JWT and attach user to req.user
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, error: 'User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    }
    next(err);
  }
};

// Check that authenticated user meets minimum role level
export const requireRole = (minimumRole) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Not authenticated.' });
  }

  const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

  if (userLevel < requiredLevel) {
    return res.status(403).json({
      success: false,
      error: `Access denied. Required role: ${minimumRole}.`,
    });
  }

  next();
};
