const database = require('../models/database');
const crypto = require('crypto');

class WebAuthnDefense {
  constructor() {
    this.defenseType = 'webauthn';
  }

  async registerDevice(userId, deviceData) {
    const { deviceName, publicKey, credentialId, userAgent } = deviceData;
    const deviceId = crypto.randomUUID();
    
    // Generate challenge for registration
    const challenge = crypto.randomBytes(32).toString('base64');
    
    // Simulate WebAuthn registration process
    const registration = {
      credential_id: credentialId || crypto.randomBytes(32).toString('base64'),
      public_key: publicKey || this.generateMockPublicKey(),
      device_name: deviceName || 'Unknown Device',
      user_agent: userAgent || 'Unknown Browser',
      challenge: challenge,
      registration_timestamp: new Date().toISOString(),
      last_used: null,
      usage_count: 0,
      attestation_type: 'packed',
      transport: ['usb', 'nfc', 'ble', 'internal'],
      aaguid: crypto.randomUUID()
    };

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO trusted_devices (id, user_id, device_fingerprint, device_name, browser_info, ip_address, is_trusted, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.getDB().run(query, [
        deviceId,
        userId,
        registration.credential_id,
        registration.device_name,
        JSON.stringify(registration),
        'webauthn-device',
        1,
        registration.registration_timestamp
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🔐 [WEBAUTHN] Device registered for user ${userId}: ${registration.device_name}`);
          
          // Log defense event
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'webauthn_registration',
            userId,
            'user_initiated',
            'Device registered for passwordless authentication',
            'device_secured'
          ], () => {
            resolve({
              deviceId,
              credentialId: registration.credential_id,
              publicKey: registration.public_key,
              deviceInfo: registration
            });
          });
        }
      });
    });
  }

  async authenticateDevice(userId, authData) {
    const { credentialId, signature, challenge } = authData;
    
    return new Promise((resolve, reject) => {
      // Find the registered device
      const query = `
        SELECT * FROM trusted_devices 
        WHERE user_id = ? AND device_fingerprint = ? AND is_trusted = 1
      `;

      database.getDB().get(query, [userId, credentialId], (err, device) => {
        if (err) {
          reject(err);
          return;
        }

        if (!device) {
          reject(new Error('Device not registered'));
          return;
        }

        // Simulate WebAuthn authentication verification
        const isValid = this.verifySignature(signature, challenge, JSON.parse(device.browser_info).public_key);
        
        if (isValid) {
          // Update last used timestamp and usage count
          const updateQuery = `
            UPDATE trusted_devices 
            SET last_used = datetime('now'),
                browser_info = json_patch(browser_info, json('{"usage_count": ' || (json_extract(browser_info, '$.usage_count') + 1) || ', "last_auth": "' || datetime('now') || '"}'))
            WHERE id = ?
          `;

          database.getDB().run(updateQuery, [device.id], () => {
            console.log(`🔐 [WEBAUTHN AUTH] Successful authentication for user ${userId}`);
            
            // Log successful defense
            const defenseLogQuery = `
              INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
              VALUES (?, ?, ?, ?, ?)
            `;
            
            database.getDB().run(defenseLogQuery, [
              'webauthn_auth',
              userId,
              'login_attempt',
              'Passwordless authentication verified',
              'authenticated'
            ], () => {
              resolve({
                verified: true,
                deviceId: device.id,
                challenge: challenge || 'simulated-challenge',
                timestamp: new Date().toISOString()
              });
            });
          });
        } else {
          reject(new Error('Invalid WebAuthn signature'));
        }
      });
    });
  }

  generateMockPublicKey() {
    // Generate a mock public key for demonstration
    return {
      kty: 'EC',
      alg: 'ES256',
      crv: 'P-256',
      x: crypto.randomBytes(32).toString('base64url'),
      y: crypto.randomBytes(32).toString('base64url'),
      generated_at: new Date().toISOString()
    };
  }

  generateChallenge() {
    return crypto.randomBytes(32).toString('base64url');
  }

  async createCredentialOptions(userId, userName, userDisplayName) {
    const challenge = this.generateChallenge();
    
    return {
      challenge: challenge,
      rp: {
        name: "2FA Cyber Attacks Lab",
        id: "localhost"
      },
      user: {
        id: userId.toString(),
        name: userName,
        displayName: userDisplayName
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" }, // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      timeout: 300000,
      excludeCredentials: await this.getExistingCredentials(userId),
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred"
      },
      attestation: "direct"
    };
  }

  async getAssertionOptions(userId) {
    const challenge = this.generateChallenge();
    const allowCredentials = await this.getExistingCredentials(userId);
    
    return {
      challenge: challenge,
      timeout: 300000,
      rpId: "localhost",
      allowCredentials: allowCredentials,
      userVerification: "required"
    };
  }

  async getExistingCredentials(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT device_fingerprint as id, browser_info 
        FROM trusted_devices 
        WHERE user_id = ? AND is_trusted = 1
      `;
      
      database.getDB().all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const credentials = rows.map(row => ({
            id: row.id,
            type: "public-key",
            transports: ["usb", "nfc", "ble", "internal"]
          }));
          resolve(credentials);
        }
      });
    });
  }

  async revokeDevice(userId, deviceId) {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE trusted_devices 
        SET is_trusted = 0, 
            last_used = datetime('now')
        WHERE user_id = ? AND id = ?
      `;
      
      database.getDB().run(query, [userId, deviceId], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🔐 [WEBAUTHN] Device revoked for user ${userId}: ${deviceId}`);
          
          // Log revocation
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'webauthn_revoke',
            userId,
            'user_action',
            `WebAuthn device ${deviceId} revoked`,
            'high'
          ]);
          
          resolve({
            success: true,
            revokedDeviceId: deviceId,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  verifySignature(signature, challenge, publicKey) {
    // Simulate signature verification
    // In a real implementation, this would verify the cryptographic signature
    if (!signature || !challenge || !publicKey) {
      return false;
    }
    
    // Simple simulation: return true if signature length is reasonable
    return signature.length > 10 && challenge.length > 10;
  }

  async getUserDevices(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          device_name,
          device_fingerprint as credential_id,
          browser_info,
          created_at,
          last_used
        FROM trusted_devices 
        WHERE user_id = ? AND ip_address = 'webauthn-device'
        ORDER BY created_at DESC
      `;

      database.getDB().all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const devices = rows.map(row => ({
            id: row.id,
            name: row.device_name,
            credential_id: row.credential_id,
            registration_info: JSON.parse(row.browser_info || '{}'),
            created_at: row.created_at,
            last_used: row.last_used,
            status: row.last_used ? 'active' : 'registered'
          }));
          resolve(devices);
        }
      });
    });
  }

  async simulatePhishingResistance(attackParams) {
    const { phishingDomain, legitimateDomain } = attackParams;
    
    console.log(`🛡️ [WEBAUTHN PHISHING TEST] Testing against domain: ${phishingDomain}`);
    
    // WebAuthn is inherently phishing-resistant due to origin binding
    const isPhishingDomain = phishingDomain !== legitimateDomain;
    
    if (isPhishingDomain) {
      console.log(`🚨 [WEBAUTHN DEFENSE] Phishing attempt blocked! Wrong origin: ${phishingDomain}`);
      
      // Log defense activation
      const defenseLogQuery = `
        INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      return new Promise((resolve) => {
        database.getDB().run(defenseLogQuery, [
          'webauthn_phishing_protection',
          null,
          'phishing_attempt',
          'Authentication blocked due to origin mismatch',
          'blocked'
        ], () => {
          resolve({
            blocked: true,
            reason: 'Origin binding prevents authentication on fraudulent domains',
            phishing_domain: phishingDomain,
            legitimate_domain: legitimateDomain,
            protection_method: 'WebAuthn origin verification',
            security_level: 'high'
          });
        });
      });
    } else {
      return {
        blocked: false,
        reason: 'Legitimate domain - authentication would proceed',
        domain: legitimateDomain,
        protection_method: 'WebAuthn origin verification',
        security_level: 'high'
      };
    }
  }

  async generateChallenge() {
    // Generate a cryptographic challenge for WebAuthn
    return {
      challenge: crypto.randomBytes(32).toString('base64url'),
      rp: {
        name: '2FA Cyber Attacks Lab',
        id: 'localhost'
      },
      user: {
        id: crypto.randomBytes(16).toString('base64url'),
        name: 'demo-user',
        displayName: 'Demo User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      timeout: 60000,
      attestation: 'direct'
    };
  }

  async getRegistrationStatistics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_devices,
          COUNT(DISTINCT user_id) as users_with_webauthn,
          AVG(json_extract(browser_info, '$.usage_count')) as avg_usage,
          MAX(last_used) as last_activity
        FROM trusted_devices 
        WHERE ip_address = 'webauthn-device'
      `;

      database.getDB().get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            total_registered_devices: row.total_devices || 0,
            users_with_webauthn: row.users_with_webauthn || 0,
            average_usage_count: Math.round(row.avg_usage || 0),
            last_activity: row.last_activity,
            security_benefits: [
              'Phishing resistance through origin binding',
              'No shared secrets (public key cryptography)',
              'Biometric authentication support',
              'Replay attack prevention',
              'Man-in-the-middle attack resistance'
            ]
          });
        }
      });
    });
  }

  async simulateTest(userId) {
    return new Promise((resolve, reject) => {
      console.log(`🧪 [WEBAUTHN TEST] Running WebAuthn defense test for user ${userId}`);
      
      // Log test in defense logs
      const defenseLogQuery = `
        INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      database.getDB().run(defenseLogQuery, [
        this.defenseType,
        userId,
        'manual_test',
        'WebAuthn defense simulation executed',
        'high'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            testResult: 'WebAuthn test completed successfully',
            effectiveness: 'high',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }
}

module.exports = WebAuthnDefense;