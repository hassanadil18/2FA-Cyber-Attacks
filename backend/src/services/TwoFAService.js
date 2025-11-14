const crypto = require('crypto');
const nodemailer = require('nodemailer');
const database = require('../models/database');

class TwoFAService {
  constructor() {
    // Initialize email transporter for local SMTP
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT || 1025,
      secure: false, // Use TLS
      auth: {
        user: process.env.SMTP_USER || 'testuser',
        pass: process.env.SMTP_PASS || 'testpass'
      },
      // For local testing, ignore TLS errors
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Generate 6-digit OTP
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate secure backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Generate push notification token
  generatePushToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Store OTP in database
  async storeOTP(userId, code, type) {
    const expiresAt = new Date(Date.now() + parseInt(process.env.OTP_EXPIRY_TIME || 300000)); // 5 minutes default
    
    return new Promise((resolve, reject) => {
      // First, mark any existing OTPs of this type as used
      const markUsedQuery = 'UPDATE otp_codes SET is_used = 1 WHERE user_id = ? AND type = ? AND is_used = 0';
      
      database.getDB().run(markUsedQuery, [userId, type], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Insert new OTP
        const insertQuery = `
          INSERT INTO otp_codes (user_id, code, type, expires_at)
          VALUES (?, ?, ?, ?)
        `;
        
        database.getDB().run(insertQuery, [userId, code, type, expiresAt.toISOString()], function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      });
    });
  }

  // Store push token
  async storePushToken(userId, token) {
    return this.storeOTP(userId, token, 'push');
  }

  // Verify OTP
  async verifyOTP(userId, code, type) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM otp_codes 
        WHERE user_id = ? AND code = ? AND type = ? AND is_used = 0 AND expires_at > datetime('now')
        ORDER BY created_at DESC
        LIMIT 1
      `;
      
      database.getDB().get(query, [userId, code, type], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(false);
          return;
        }

        // Mark OTP as used
        const updateQuery = 'UPDATE otp_codes SET is_used = 1 WHERE id = ?';
        database.getDB().run(updateQuery, [row.id], (updateErr) => {
          if (updateErr) {
            reject(updateErr);
          } else {
            resolve(true);
          }
        });
      });
    });
  }

  // Verify push token
  async verifyPushToken(userId, token) {
    return this.verifyOTP(userId, token, 'push');
  }

  // Send email OTP
  async sendEmailOTP(email, otp) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@2fa-lab.local',
      to: email,
      subject: '2FA Security Code - Cyber Attacks Lab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">🔐 Your Security Code</h2>
          <p>Your two-factor authentication code is:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${otp}</span>
          </div>
          <p style="color: #666;">This code will expire in 5 minutes.</p>
          <p style="color: #666; font-size: 12px;">
            ⚠️ This is a simulated message from the 2FA Cyber Attacks Lab for educational purposes only.
          </p>
        </div>
      `
    };

    try {
      const info = await this.emailTransporter.sendMail(mailOptions);
      console.log('📧 Email OTP sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('📧 Email sending failed:', error);
      // For demo purposes, don't throw error if SMTP server is not available
      console.log(`📧 [MOCK EMAIL] To: ${email}, Code: ${otp}`);
      return { messageId: 'mock-email-' + Date.now() };
    }
  }

  // Utility functions
  maskEmail(email) {
    const [username, domain] = email.split('@');
    const maskedUsername = username.substring(0, 2) + '*'.repeat(username.length - 2);
    return `${maskedUsername}@${domain}`;
  }

  maskPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 4) {
      return '*'.repeat(cleaned.length - 4) + cleaned.slice(-4);
    }
    return '*'.repeat(cleaned.length);
  }

  // Clean up expired OTPs
  async cleanupExpiredOTPs() {
    return new Promise((resolve, reject) => {
      const query = "DELETE FROM otp_codes WHERE expires_at < datetime('now')";
      
      database.getDB().run(query, [], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🧹 Cleaned up ${this.changes} expired OTPs`);
          resolve(this.changes);
        }
      });
    });
  }

  // Get OTP statistics
  async getOTPStats(userId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          type,
          COUNT(*) as total,
          SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used,
          SUM(CASE WHEN expires_at < datetime('now') THEN 1 ELSE 0 END) as expired
        FROM otp_codes
      `;
      
      let params = [];
      if (userId) {
        query += ' WHERE user_id = ?';
        params.push(userId);
      }
      
      query += ' GROUP BY type';
      
      database.getDB().all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

// Create singleton instance
const twoFAService = new TwoFAService();

// Cleanup expired OTPs every hour
setInterval(() => {
  twoFAService.cleanupExpiredOTPs().catch(console.error);
}, 60 * 60 * 1000);

module.exports = twoFAService;