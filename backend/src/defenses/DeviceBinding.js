const database = require('../models/database');
const crypto = require('crypto');

class DeviceBinding {
  constructor() {
    this.defenseType = 'device_binding';
    this.trustThreshold = 3; // Number of successful logins to trust a device
  }

  async generateDeviceFingerprint(deviceInfo) {
    const { userAgent, screen, timezone, language, platform, plugins } = deviceInfo;
    
    // Create a comprehensive device fingerprint
    const fingerprintData = {
      userAgent: userAgent || 'unknown',
      screen: screen || 'unknown',
      timezone: timezone || 'unknown',
      language: language || 'en-US',
      platform: platform || 'unknown',
      plugins: plugins || [],
      timestamp: new Date().toISOString()
    };

    // Generate fingerprint hash
    const fingerprintString = JSON.stringify(fingerprintData);
    const fingerprint = crypto.createHash('sha256').update(fingerprintString).digest('hex');
    
    return {
      fingerprint,
      components: fingerprintData,
      strength: this.calculateFingerprintStrength(fingerprintData)
    };
  }

  calculateFingerprintStrength(data) {
    let strength = 0;
    
    // Score based on available information
    if (data.userAgent && data.userAgent !== 'unknown') strength += 20;
    if (data.screen && data.screen !== 'unknown') strength += 15;
    if (data.timezone && data.timezone !== 'unknown') strength += 10;
    if (data.language && data.language !== 'en-US') strength += 5;
    if (data.platform && data.platform !== 'unknown') strength += 10;
    if (data.plugins && data.plugins.length > 0) strength += 20;
    
    // Bonus for unique combinations
    if (strength > 50) strength += 20;
    
    return Math.min(strength, 100);
  }

  async trustDevice(userId, deviceData) {
    const { fingerprint, userAgent, ipAddress, deviceName, platform, language, screenResolution } = deviceData;
    const deviceId = crypto.randomUUID();
    
    return new Promise((resolve, reject) => {
      // Check if device already exists
      const checkQuery = `
        SELECT * FROM trusted_devices 
        WHERE user_id = ? AND device_fingerprint = ?
      `;

      database.getDB().get(checkQuery, [userId, fingerprint], (err, existingDevice) => {
        if (err) {
          reject(err);
          return;
        }

        if (existingDevice) {
          // Update existing device
          const updateQuery = `
            UPDATE trusted_devices 
            SET is_trusted = 1, 
                trust_level = 10,
                last_used = datetime('now'),
                device_name = ?
            WHERE id = ?
          `;
          
          database.getDB().run(updateQuery, [deviceName, existingDevice.id], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve({
                deviceId: existingDevice.id,
                trustLevel: 10,
                deviceName: deviceName
              });
            }
          });
          return;
        }

        // Register new device
        const browserInfo = {
          userAgent,
          platform,
          language,
          screenResolution,
          timestamp: new Date().toISOString()
        };
        
        const insertQuery = `
          INSERT INTO trusted_devices (
            id, user_id, device_fingerprint, device_name, browser_info, 
            ip_address, is_trusted, trust_level, created_at, last_used
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        database.getDB().run(insertQuery, [
          deviceId,
          userId,
          fingerprint,
          deviceName,
          JSON.stringify(browserInfo),
          ipAddress,
          1, // Trusted immediately
          10, // Full trust level
          new Date().toISOString(),
          new Date().toISOString()
        ], function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`📱 [DEVICE BINDING] Device trusted for user ${userId}: ${deviceName}`);
            
            // Log defense event
            const defenseLogQuery = `
              INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
              VALUES (?, ?, ?, ?, ?)
            `;
            
            database.getDB().run(defenseLogQuery, [
              'device_trust',
              userId,
              'user_action',
              `Device "${deviceName}" added to trusted devices`,
              'device_secured'
            ], () => {
              resolve({
                deviceId,
                trustLevel: 10,
                deviceName: deviceName
              });
            });
          }
        });
      });
    });
  }

  generateDeviceName(components) {
    const { userAgent, platform } = components;
    
    let deviceName = 'Unknown Device';
    
    if (userAgent) {
      if (userAgent.includes('Chrome')) deviceName = 'Chrome Browser';
      else if (userAgent.includes('Firefox')) deviceName = 'Firefox Browser';
      else if (userAgent.includes('Safari')) deviceName = 'Safari Browser';
      else if (userAgent.includes('Edge')) deviceName = 'Edge Browser';
    }
    
    if (platform) {
      if (platform.includes('Win')) deviceName += ' on Windows';
      else if (platform.includes('Mac')) deviceName += ' on macOS';
      else if (platform.includes('Linux')) deviceName += ' on Linux';
      else if (platform.includes('Android')) deviceName += ' on Android';
      else if (platform.includes('iPhone')) deviceName += ' on iPhone';
    }
    
    return deviceName;
  }

  async verifyDeviceLogin(userId, deviceFingerprint, ipAddress) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM trusted_devices 
        WHERE user_id = ? AND device_fingerprint = ?
      `;

      database.getDB().get(query, [userId, deviceFingerprint], (err, device) => {
        if (err) {
          reject(err);
          return;
        }

        if (!device) {
          resolve({
            isKnownDevice: false,
            requiresAdditionalAuth: true,
            riskLevel: 'high',
            reason: 'Unknown device fingerprint'
          });
          return;
        }

        // Update device trust level and last used
        const newTrustLevel = Math.min(device.trust_level + 1, 10);
        const isTrusted = newTrustLevel >= this.trustThreshold;

        const updateQuery = `
          UPDATE trusted_devices 
          SET 
            trust_level = ?,
            is_trusted = ?,
            last_used = datetime('now'),
            ip_address = ?
          WHERE id = ?
        `;

        database.getDB().run(updateQuery, [newTrustLevel, isTrusted ? 1 : 0, ipAddress, device.id], () => {
          console.log(`📱 [DEVICE BINDING] Device verification for user ${userId}: Trust level ${newTrustLevel}`);
          
          // Log verification
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          const action = isTrusted ? 'Device trusted - normal login flow' : 'Device requires additional verification';
          const effectiveness = isTrusted ? 'trusted' : 'verification_required';
          
          database.getDB().run(defenseLogQuery, [
            'device_verification',
            userId,
            'login_attempt',
            action,
            effectiveness
          ], () => {
            resolve({
              isKnownDevice: true,
              isTrusted,
              trustLevel: newTrustLevel,
              requiresAdditionalAuth: !isTrusted,
              riskLevel: isTrusted ? 'low' : 'medium',
              deviceId: device.id,
              deviceName: device.device_name
            });
          });
        });
      });
    });
  }

  async manuallyTrustDevice(userId, deviceId) {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE trusted_devices 
        SET is_trusted = 1, trust_level = 10, last_used = datetime('now')
        WHERE id = ? AND user_id = ?
      `;

      database.getDB().run(updateQuery, [deviceId, userId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Device not found or not owned by user'));
        } else {
          console.log(`✅ [DEVICE BINDING] Device manually trusted: ${deviceId}`);
          
          // Log manual trust
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'device_manual_trust',
            userId,
            'user_action',
            'Device manually marked as trusted',
            'trusted'
          ], () => {
            resolve({
              deviceId,
              status: 'trusted',
              trustLevel: 10,
              timestamp: new Date().toISOString()
            });
          });
        }
      });
    });
  }

  async revokeDevice(userId, deviceId) {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE trusted_devices 
        SET is_trusted = 0, trust_level = 0
        WHERE id = ? AND user_id = ?
      `;

      database.getDB().run(updateQuery, [deviceId, userId], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Device not found or not owned by user'));
        } else {
          console.log(`🚫 [DEVICE BINDING] Device revoked: ${deviceId}`);
          
          // Log revocation
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'device_revocation',
            userId,
            'user_action',
            'Device access revoked',
            'revoked'
          ], () => {
            resolve({
              deviceId,
              status: 'revoked',
              timestamp: new Date().toISOString()
            });
          });
        }
      });
    });
  }

  async getTrustedDevices(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          device_fingerprint,
          device_name,
          browser_info,
          ip_address,
          is_trusted,
          trust_level,
          created_at,
          last_used
        FROM trusted_devices 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      
      database.getDB().all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const devices = rows.map(row => {
            let browserInfo;
            try {
              browserInfo = JSON.parse(row.browser_info);
            } catch (e) {
              browserInfo = {};
            }
            
            return {
              id: row.id,
              device_name: row.device_name,
              platform: browserInfo.platform || 'Unknown',
              userAgent: browserInfo.userAgent || 'Unknown Browser',
              ip_address: row.ip_address,
              is_trusted: Boolean(row.is_trusted),
              trust_level: row.trust_level,
              created_at: row.created_at,
              last_seen: row.last_used || row.created_at,
              fingerprint_strength: this.calculateFingerprintStrength(browserInfo)
            };
          });
          resolve(devices);
        }
      });
    });
  }

  async getDeviceSecurityStatus(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_devices,
          COUNT(CASE WHEN is_trusted = 1 THEN 1 END) as trusted_devices,
          COUNT(CASE WHEN created_at > datetime('now', '-7 days') THEN 1 END) as recent_devices,
          AVG(trust_level) as avg_trust_level,
          MAX(last_used) as last_activity
        FROM trusted_devices 
        WHERE user_id = ?
      `;
      
      database.getDB().get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            total_devices: row.total_devices || 0,
            trusted_devices: row.trusted_devices || 0,
            untrusted_devices: (row.total_devices || 0) - (row.trusted_devices || 0),
            recent_devices: row.recent_devices || 0,
            average_trust_level: Math.round(row.avg_trust_level || 0),
            last_activity: row.last_activity,
            security_score: this.calculateSecurityScore(row),
            recommendations: this.getSecurityRecommendations(row)
          });
        }
      });
    });
  }

  calculateSecurityScore(deviceStats) {
    let score = 50; // Base score
    
    const totalDevices = deviceStats.total_devices || 0;
    const trustedDevices = deviceStats.trusted_devices || 0;
    const avgTrustLevel = deviceStats.avg_trust_level || 0;
    
    // Positive factors
    if (trustedDevices > 0) score += 20;
    if (avgTrustLevel > 5) score += 15;
    if (totalDevices <= 3) score += 10; // Few devices is safer
    
    // Negative factors
    if (totalDevices > 5) score -= 10; // Too many devices
    if (trustedDevices / totalDevices < 0.5) score -= 15; // Low trust ratio
    
    return Math.max(0, Math.min(100, score));
  }

  getSecurityRecommendations(deviceStats) {
    const recommendations = [];
    const totalDevices = deviceStats.total_devices || 0;
    const trustedDevices = deviceStats.trusted_devices || 0;
    
    if (totalDevices === 0) {
      recommendations.push("Set up device binding for enhanced security");
    }
    
    if (totalDevices > 5) {
      recommendations.push("Consider removing unused devices");
    }
    
    if (trustedDevices === 0) {
      recommendations.push("Build trust by logging in from consistent devices");
    }
    
    if (trustedDevices / totalDevices < 0.5) {
      recommendations.push("Review and remove untrusted devices");
    }
    
    return recommendations;
  }

  async getUserDevices(userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          device_name,
          device_fingerprint,
          browser_info,
          ip_address,
          is_trusted,
          trust_level,
          created_at,
          last_used
        FROM trusted_devices 
        WHERE user_id = ?
        ORDER BY last_used DESC, created_at DESC
      `;

      database.getDB().all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const devices = rows.map(row => ({
            id: row.id,
            name: row.device_name,
            fingerprint: row.device_fingerprint.substring(0, 16) + '...',
            browserInfo: JSON.parse(row.browser_info || '{}'),
            ipAddress: row.ip_address,
            isTrusted: row.is_trusted === 1,
            trustLevel: row.trust_level,
            status: this.getDeviceStatus(row),
            createdAt: row.created_at,
            lastUsed: row.last_used
          }));
          resolve(devices);
        }
      });
    });
  }

  getDeviceStatus(device) {
    if (device.is_trusted) return 'trusted';
    if (device.trust_level >= this.trustThreshold) return 'pending_trust';
    if (device.last_used) return 'active';
    return 'new';
  }

  async simulateUnknownDeviceLogin(userId, suspiciousDeviceInfo) {
    console.log(`🚨 [DEVICE BINDING TEST] Simulating unknown device login for user ${userId}`);
    
    const deviceFingerprint = await this.generateDeviceFingerprint(suspiciousDeviceInfo);
    
    // Simulate unknown device scenario
    const verification = await this.verifyDeviceLogin(userId, 'unknown_device_fingerprint', '192.168.1.100');
    
    if (verification.requiresAdditionalAuth) {
      console.log(`🛡️ [DEVICE BINDING DEFENSE] Unknown device detected - additional authentication required`);
      
      // Log defense activation
      const defenseLogQuery = `
        INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      return new Promise((resolve) => {
        database.getDB().run(defenseLogQuery, [
          'unknown_device_protection',
          userId,
          'suspicious_login',
          'Additional authentication required for unknown device',
          'protected'
        ], () => {
          resolve({
            blocked: false,
            additionalAuthRequired: true,
            riskLevel: verification.riskLevel,
            reason: 'Unknown device fingerprint detected',
            protection_methods: [
              'Device fingerprinting',
              'Trust level verification',
              'Additional authentication challenge'
            ],
            recommendations: [
              'Verify device through email/SMS',
              'Enable device notifications',
              'Review account activity'
            ]
          });
        });
      });
    }

    return {
      blocked: false,
      additionalAuthRequired: false,
      riskLevel: 'low',
      reason: 'Known trusted device'
    };
  }

  async getBindingStatistics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_devices,
          COUNT(DISTINCT user_id) as users_with_devices,
          SUM(CASE WHEN is_trusted = 1 THEN 1 ELSE 0 END) as trusted_devices,
          AVG(trust_level) as avg_trust_level,
          COUNT(CASE WHEN last_used > datetime('now', '-7 days') THEN 1 END) as active_devices
        FROM trusted_devices
      `;

      database.getDB().get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            total_registered_devices: row.total_devices || 0,
            users_with_bound_devices: row.users_with_devices || 0,
            trusted_devices: row.trusted_devices || 0,
            average_trust_level: Math.round((row.avg_trust_level || 0) * 10) / 10,
            active_devices_week: row.active_devices || 0,
            trust_threshold: this.trustThreshold,
            security_benefits: [
              'Unknown device detection',
              'Progressive trust building',
              'Automated risk assessment',
              'User-controlled device management',
              'Login anomaly detection'
            ]
          });
        }
      });
    });
  }

  async simulateTest(userId) {
    return new Promise((resolve, reject) => {
      console.log(`🧪 [DEVICE BINDING TEST] Running device binding test for user ${userId}`);
      
      // Log test in defense logs
      const defenseLogQuery = `
        INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      database.getDB().run(defenseLogQuery, [
        this.defenseType,
        userId,
        'manual_test',
        'Device binding defense simulation executed',
        'medium'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            testResult: 'Device binding test completed successfully',
            effectiveness: 'medium',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  async revokeDevice(userId, deviceId) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM trusted_devices WHERE id = ? AND user_id = ?`;
      
      database.getDB().run(query, [deviceId, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          // Log defense event
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'device_revocation',
            userId,
            'user_action',
            `Device ${deviceId} revoked`,
            'device_removed'
          ], () => {
            resolve({
              message: 'Device revoked successfully',
              deviceId,
              rowsDeleted: this.changes
            });
          });
        }
      });
    });
  }
}

module.exports = DeviceBinding;