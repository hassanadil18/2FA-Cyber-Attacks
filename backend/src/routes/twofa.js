const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const TwoFAService = require('../services/TwoFAService');

const router = express.Router();

// Generate TOTP secret and QR code
router.post('/totp/setup', authMiddleware, async (req, res) => {
 try {
 const secret = speakeasy.generateSecret({
 name: `${req.user.username} (${process.env.TOTP_ISSUER})`,
 issuer: process.env.TOTP_ISSUER
 });

 // Store the secret temporarily (not activated until verified)
 await req.user.updateTOTPSecret(secret.base32);

 // Generate QR code
 const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

 res.json({
 secret: secret.base32,
 qrcode: qrCodeDataURL,
 manual_entry_key: secret.base32,
 issuer: process.env.TOTP_ISSUER,
 account_name: req.user.username
 });

 } catch (error) {
 console.error('TOTP setup error:', error);
 res.status(500).json({ error: 'Failed to setup TOTP' });
 }
});

// Verify TOTP code and enable 2FA
router.post('/totp/verify', authMiddleware, async (req, res) => {
 try {
 const { token } = req.body;

 if (!token) {
 return res.status(400).json({ error: 'TOTP token is required' });
 }

 if (!req.user.totp_secret) {
 return res.status(400).json({ error: 'TOTP not set up. Please setup TOTP first.' });
 }

 const verified = speakeasy.totp.verify({
 secret: req.user.totp_secret,
 encoding: 'base32',
 token: token,
 window: 2
 });

 if (!verified) {
 return res.status(400).json({ error: 'Invalid TOTP token' });
 }

 // Enable 2FA for the user
 await req.user.enable2FA();

 // Generate backup codes
 const backupCodes = TwoFAService.generateBackupCodes();
 await req.user.updateBackupCodes(backupCodes);

 res.json({
 message: '2FA enabled successfully',
 backup_codes: backupCodes
 });

 } catch (error) {
 console.error('TOTP verification error:', error);
 res.status(500).json({ error: 'Failed to verify TOTP' });
 }
});

// Disable 2FA
router.post('/disable', authMiddleware, async (req, res) => {
 try {
 const { password, confirmation_code } = req.body;

 if (!password) {
 return res.status(400).json({ error: 'Password is required to disable 2FA' });
 }

 // Verify password
 const isValidPassword = await req.user.verifyPassword(password);
 if (!isValidPassword) {
 return res.status(401).json({ error: 'Invalid password' });
 }

 // If 2FA is enabled, require a valid 2FA code
 if (req.user.is_2fa_enabled && confirmation_code) {
 const verified = speakeasy.totp.verify({
 secret: req.user.totp_secret,
 encoding: 'base32',
 token: confirmation_code,
 window: 2
 });

 if (!verified) {
 return res.status(400).json({ error: 'Invalid 2FA code' });
 }
 }

 await req.user.disable2FA();

 res.json({ message: '2FA disabled successfully' });

 } catch (error) {
 console.error('2FA disable error:', error);
 res.status(500).json({ error: 'Failed to disable 2FA' });
 }
});

// Send SMS OTP (mocked)
router.post('/sms/send', authMiddleware, async (req, res) => {
 try {
 if (!req.user.phone) {
 return res.status(400).json({ error: 'No phone number associated with account' });
 }

 const otp = TwoFAService.generateOTP();
 await TwoFAService.storeOTP(req.user.id, otp, 'sms');

 // Mock SMS sending (in real app, integrate with SMS service)
 console.log(` [MOCK SMS] To: ${req.user.phone}, Code: ${otp}`);

 res.json({
 message: 'SMS OTP sent successfully',
 phone_masked: TwoFAService.maskPhoneNumber(req.user.phone),
 mock_code: process.env.NODE_ENV === 'development' ? otp : undefined
 });

 } catch (error) {
 console.error('SMS OTP error:', error);
 res.status(500).json({ error: 'Failed to send SMS OTP' });
 }
});

// Send Email OTP
router.post('/email/send', authMiddleware, async (req, res) => {
 try {
 const otp = TwoFAService.generateOTP();
 await TwoFAService.storeOTP(req.user.id, otp, 'email');

 // Send email using local SMTP
 await TwoFAService.sendEmailOTP(req.user.email, otp);

 res.json({
 message: 'Email OTP sent successfully',
 email_masked: TwoFAService.maskEmail(req.user.email),
 mock_code: process.env.NODE_ENV === 'development' ? otp : undefined
 });

 } catch (error) {
 console.error('Email OTP error:', error);
 res.status(500).json({ error: 'Failed to send Email OTP' });
 }
});

// Verify OTP (SMS/Email)
router.post('/otp/verify', authMiddleware, async (req, res) => {
 try {
 const { code, type } = req.body;

 if (!code || !type) {
 return res.status(400).json({ error: 'OTP code and type are required' });
 }

 const isValid = await TwoFAService.verifyOTP(req.user.id, code, type);

 if (!isValid) {
 return res.status(400).json({ error: 'Invalid or expired OTP' });
 }

 res.json({ message: 'OTP verified successfully' });

 } catch (error) {
 console.error('OTP verification error:', error);
 res.status(500).json({ error: 'Failed to verify OTP' });
 }
});

// Send Push Notification (mocked)
router.post('/push/send', authMiddleware, async (req, res) => {
 try {
 const pushToken = TwoFAService.generatePushToken();
 await TwoFAService.storePushToken(req.user.id, pushToken);

 // Mock push notification
 console.log(` [MOCK PUSH] To: ${req.user.username}, Token: ${pushToken}`);

 res.json({
 message: 'Push notification sent',
 token: pushToken,
 expires_in: 300 // 5 minutes
 });

 } catch (error) {
 console.error('Push notification error:', error);
 res.status(500).json({ error: 'Failed to send push notification' });
 }
});

// Verify Push Token
router.post('/push/verify', authMiddleware, async (req, res) => {
 try {
 const { token, action } = req.body; // action: 'approve' or 'deny'

 if (!token || !action) {
 return res.status(400).json({ error: 'Token and action are required' });
 }

 const isValid = await TwoFAService.verifyPushToken(req.user.id, token);

 if (!isValid) {
 return res.status(400).json({ error: 'Invalid or expired push token' });
 }

 if (action === 'approve') {
 res.json({ message: 'Push notification approved' });
 } else {
 res.json({ message: 'Push notification denied' });
 }

 } catch (error) {
 console.error('Push verification error:', error);
 res.status(500).json({ error: 'Failed to verify push token' });
 }
});

// Get 2FA status
router.get('/status', authMiddleware, (req, res) => {
 res.json({
 is_2fa_enabled: req.user.is_2fa_enabled,
 available_methods: {
 totp: !!req.user.totp_secret,
 sms: !!req.user.phone,
 email: true,
 push: true
 },
 backup_codes_count: req.user.getBackupCodes().length
 });
});

// Generate new backup codes
router.post('/backup-codes/regenerate', authMiddleware, async (req, res) => {
 try {
 if (!req.user.is_2fa_enabled) {
 return res.status(400).json({ error: '2FA must be enabled first' });
 }

 const backupCodes = TwoFAService.generateBackupCodes();
 await req.user.updateBackupCodes(backupCodes);

 res.json({
 message: 'Backup codes regenerated',
 backup_codes: backupCodes
 });

 } catch (error) {
 console.error('Backup codes regeneration error:', error);
 res.status(500).json({ error: 'Failed to regenerate backup codes' });
 }
});

module.exports = router;