const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const database = require('../models/database');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function to log login attempts
const logLoginAttempt = (username, ip, userAgent, success, failureReason = null, attackType = null) => {
  const query = `
    INSERT INTO login_attempts (username, ip_address, user_agent, success, failure_reason, attack_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  database.getDB().run(query, [username, ip, userAgent, success, failureReason, attackType], (err) => {
    if (err) {
      console.error('Error logging login attempt:', err);
    }
  });
};

// Register endpoint
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create user
    const user = await User.create({ username, email, password, phone });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Log successful registration as login attempt
    logLoginAttempt(username, req.ip, req.get('User-Agent'), true);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        is_2fa_enabled: false
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password, twofa_code } = req.body;

    if (!username || !password) {
      logLoginAttempt(username, req.ip, req.get('User-Agent'), false, 'Missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await User.findByUsername(username);
    if (!user) {
      logLoginAttempt(username, req.ip, req.get('User-Agent'), false, 'User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      logLoginAttempt(username, req.ip, req.get('User-Agent'), false, 'Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if 2FA is enabled
    if (user.is_2fa_enabled) {
      if (!twofa_code) {
        return res.status(200).json({
          requires_2fa: true,
          message: '2FA code required',
          available_methods: ['totp', 'sms', 'email']
        });
      }

      // For now, we'll implement a simple TOTP verification
      // This will be expanded in the 2FA module
      const speakeasy = require('speakeasy');
      const verified = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: twofa_code,
        window: 2
      });

      if (!verified) {
        logLoginAttempt(username, req.ip, req.get('User-Agent'), false, 'Invalid 2FA code');
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log successful login
    logLoginAttempt(username, req.ip, req.get('User-Agent'), true);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject()
    });

  } catch (error) {
    console.error('Login error:', error);
    logLoginAttempt(req.body.username, req.ip, req.get('User-Agent'), false, 'Server error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user.toSafeObject() });
});

// Logout endpoint (client-side token invalidation)
router.post('/logout', authMiddleware, (req, res) => {
  // In a real application, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
});

// Password change endpoint
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    // Verify current password
    const isValidPassword = await req.user.verifyPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password and update
    const bcrypt = require('bcryptjs');
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    database.getDB().run(query, [newPasswordHash, req.user.id], (err) => {
      if (err) {
        console.error('Password change error:', err);
        return res.status(500).json({ error: 'Failed to change password' });
      }

      res.json({ message: 'Password changed successfully' });
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;