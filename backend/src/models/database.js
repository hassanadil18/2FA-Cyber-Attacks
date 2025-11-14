const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'lab.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('✅ Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone TEXT,
        is_2fa_enabled BOOLEAN DEFAULT 0,
        totp_secret TEXT,
        backup_codes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // User sessions table
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        device_fingerprint TEXT,
        ip_address TEXT,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // OTP codes table
      `CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        code TEXT NOT NULL,
        type TEXT NOT NULL, -- 'sms', 'email', 'totp', 'push'
        is_used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Login attempts table
      `CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        ip_address TEXT,
        user_agent TEXT,
        success BOOLEAN NOT NULL,
        failure_reason TEXT,
        attack_type TEXT, -- null for normal attempts
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Attack logs table
      `CREATE TABLE IF NOT EXISTS attack_logs (
        id TEXT PRIMARY KEY, -- Use TEXT for UUID instead of INTEGER
        attack_type TEXT NOT NULL, -- 'phishing', 'mitm', 'sim_swap', 'replay'
        target_user_id INTEGER,
        attacker_ip TEXT,
        attack_data TEXT, -- JSON data about the attack
        status TEXT NOT NULL, -- 'initiated', 'in_progress', 'successful', 'failed', 'detected'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (target_user_id) REFERENCES users (id)
      )`,

      // Defense logs table
      `CREATE TABLE IF NOT EXISTS defense_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        defense_type TEXT NOT NULL, -- 'rate_limit', 'device_binding', 'webauthn', 'alert'
        user_id INTEGER,
        triggered_by TEXT, -- what triggered the defense
        action_taken TEXT,
        effectiveness TEXT, -- 'blocked', 'alerted', 'logged'
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Devices table for device binding
      `CREATE TABLE IF NOT EXISTS trusted_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        device_fingerprint TEXT NOT NULL,
        device_name TEXT,
        browser_info TEXT,
        ip_address TEXT,
        is_trusted BOOLEAN DEFAULT 0,
        last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`,

      // Security events table
      `CREATE TABLE IF NOT EXISTS security_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
        user_id INTEGER,
        description TEXT NOT NULL,
        metadata TEXT, -- JSON additional data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`
    ];

    tables.forEach((table, index) => {
      this.db.run(table, (err) => {
        if (err) {
          console.error(`Error creating table ${index + 1}:`, err);
        }
      });
    });

    console.log('✅ Database tables initialized');
  }

  getDB() {
    return this.db;
  }

  close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('📦 Database connection closed');
          resolve();
        }
      });
    });
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;