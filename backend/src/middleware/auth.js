const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const require2FA = (req, res, next) => {
  if (!req.user.is_2fa_enabled) {
    return res.status(403).json({ 
      error: '2FA is required for this action',
      requires_2fa: true 
    });
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = {
  authMiddleware,
  require2FA,
  optionalAuth
};