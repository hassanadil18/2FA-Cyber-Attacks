const database = require('../models/database');
const nodemailer = require('nodemailer');

class AlertSystem {
  constructor() {
    this.defenseType = 'alert_system';
    this.alertThresholds = {
      failed_logins: 3,
      unknown_device: 1,
      unusual_location: 1,
      multiple_sessions: 2,
      suspicious_patterns: 5
    };
    
    this.alertTypes = {
      security: { priority: 'high', channels: ['email', 'sms', 'push'] },
      login: { priority: 'medium', channels: ['email', 'push'] },
      device: { priority: 'medium', channels: ['email'] },
      account: { priority: 'high', channels: ['email', 'sms'] },
      system: { priority: 'low', channels: ['email'] }
    };

    this.setupEmailTransporter();
  }

  setupEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER || 'demo@2fa-lab.com',
          pass: process.env.EMAIL_PASS || 'demo-password'
        }
      });
    } catch (error) {
      console.log('⚠️  Email transporter setup failed (non-critical):', error.message);
      this.emailTransporter = null;
    }
  }

  async triggerAlert(alertType, userId, details, severity = 'medium') {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const alertData = {
      id: alertId,
      type: alertType,
      user_id: userId,
      severity,
      details,
      timestamp: new Date().toISOString(),
      status: 'active',
      channels_sent: [],
      actions_taken: []
    };

    // Store alert in database
    await this.storeAlert(alertData);

    // Send notifications through configured channels
    await this.sendNotifications(alertData);

    // Execute automated responses if configured
    await this.executeAutomatedResponse(alertData);

    console.log(`🚨 [ALERT SYSTEM] ${severity.toUpperCase()} alert triggered: ${alertType} for user ${userId}`);

    return alertData;
  }

  async storeAlert(alertData) {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO security_events (
          event_type, identifier, details, timestamp, expires_at
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days

      database.getDB().run(insertQuery, [
        'security_alert',
        alertData.user_id || 'system',
        JSON.stringify(alertData),
        Date.now(),
        expiresAt
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          // Log defense event
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'alert_generation',
            alertData.user_id,
            alertData.type,
            `${alertData.severity} alert generated: ${alertData.type}`,
            'alerted'
          ], () => resolve(this.lastID));
        }
      });
    });
  }

  async sendNotifications(alertData) {
    const alertConfig = this.alertTypes[alertData.type] || this.alertTypes.security;
    const notifications = [];

    // Send email notification
    if (alertConfig.channels.includes('email')) {
      try {
        const emailResult = await this.sendEmailAlert(alertData);
        notifications.push({ channel: 'email', status: 'sent', result: emailResult });
        alertData.channels_sent.push('email');
      } catch (error) {
        notifications.push({ channel: 'email', status: 'failed', error: error.message });
      }
    }

    // Send SMS notification (simulated)
    if (alertConfig.channels.includes('sms')) {
      const smsResult = await this.sendSMSAlert(alertData);
      notifications.push({ channel: 'sms', status: 'sent', result: smsResult });
      alertData.channels_sent.push('sms');
    }

    // Send push notification (simulated)
    if (alertConfig.channels.includes('push')) {
      const pushResult = await this.sendPushAlert(alertData);
      notifications.push({ channel: 'push', status: 'sent', result: pushResult });
      alertData.channels_sent.push('push');
    }

    return notifications;
  }

  async sendEmailAlert(alertData) {
    const subject = this.generateEmailSubject(alertData);
    const html = this.generateEmailContent(alertData);

    // Get user email
    const userEmail = await this.getUserEmail(alertData.user_id);

    const mailOptions = {
      from: '"2FA Security Lab" <security@2fa-lab.com>',
      to: userEmail || 'admin@2fa-lab.com',
      subject,
      html
    };

    try {
      // For demo purposes, we'll simulate email sending
      console.log(`📧 [EMAIL ALERT] Sending to ${mailOptions.to}: ${subject}`);
      return {
        messageId: `mock_${Date.now()}`,
        to: mailOptions.to,
        subject: mailOptions.subject,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Email alert failed:', error.message);
      throw error;
    }
  }

  generateEmailSubject(alertData) {
    const subjects = {
      failed_logins: `🚨 Security Alert: Multiple Failed Login Attempts`,
      unknown_device: `🔐 Security Alert: New Device Login Detected`,
      unusual_location: `🌍 Security Alert: Login from Unusual Location`,
      multiple_sessions: `📱 Security Alert: Multiple Active Sessions`,
      suspicious_patterns: `⚠️ Security Alert: Suspicious Account Activity`,
      default: `🚨 Security Alert: Account Activity`
    };

    return subjects[alertData.type] || subjects.default;
  }

  generateEmailContent(alertData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #dc3545; margin: 0;">Security Alert</h2>
          <p style="margin: 10px 0 0 0; color: #6c757d;">
            Alert Type: <strong>${alertData.type}</strong> | 
            Severity: <strong style="color: ${this.getSeverityColor(alertData.severity)}">${alertData.severity.toUpperCase()}</strong>
          </p>
        </div>
        
        <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; margin-bottom: 20px;">
          <h3>Alert Details</h3>
          <p><strong>Time:</strong> ${alertData.timestamp}</p>
          <p><strong>Alert ID:</strong> ${alertData.id}</p>
          
          <h4>Description:</h4>
          <p>${this.getAlertDescription(alertData)}</p>
          
          ${alertData.details ? `
            <h4>Additional Information:</h4>
            <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(alertData.details, null, 2)}
            </pre>
          ` : ''}
        </div>
        
        <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #0056b3;">Recommended Actions</h3>
          <ul>
            ${this.getRecommendedActions(alertData).map(action => `<li>${action}</li>`).join('')}
          </ul>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #dee2e6;">
          <p>This is an automated security alert from 2FA Cyber Attacks Lab</p>
          <p>If you did not expect this alert, please review your account immediately.</p>
        </div>
      </div>
    `;
  }

  getSeverityColor(severity) {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545',
      critical: '#6f42c1'
    };
    return colors[severity] || colors.medium;
  }

  getAlertDescription(alertData) {
    const descriptions = {
      failed_logins: 'Multiple failed login attempts have been detected on your account.',
      unknown_device: 'A login attempt was made from an unrecognized device.',
      unusual_location: 'A login attempt was made from an unusual geographic location.',
      multiple_sessions: 'Multiple active sessions have been detected on your account.',
      suspicious_patterns: 'Suspicious activity patterns have been detected on your account.',
      default: 'Security alert has been triggered for your account.'
    };

    return descriptions[alertData.type] || descriptions.default;
  }

  getRecommendedActions(alertData) {
    const actions = {
      failed_logins: [
        'Change your password immediately',
        'Enable 2FA if not already active',
        'Review recent login activity',
        'Check for any unauthorized access'
      ],
      unknown_device: [
        'Verify if this was your login attempt',
        'If unauthorized, change your password',
        'Review and manage trusted devices',
        'Enable login notifications'
      ],
      unusual_location: [
        'Confirm if you recently traveled or used a VPN',
        'If unauthorized, secure your account immediately',
        'Review location history',
        'Enable location-based alerts'
      ],
      multiple_sessions: [
        'Review active sessions in your account',
        'Terminate any unauthorized sessions',
        'Change your password if suspicious',
        'Enable session monitoring'
      ],
      suspicious_patterns: [
        'Review all recent account activity',
        'Change password and enable 2FA',
        'Check for any unauthorized changes',
        'Contact support if needed'
      ]
    };

    return actions[alertData.type] || actions.failed_logins;
  }

  async sendSMSAlert(alertData) {
    // Simulate SMS sending
    const message = `🚨 Security Alert: ${alertData.type} detected on your 2FA Lab account. Check your email for details. Alert ID: ${alertData.id}`;
    
    console.log(`📱 [SMS ALERT] Sending SMS: ${message.substring(0, 50)}...`);
    
    return {
      messageId: `sms_${Date.now()}`,
      message: message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
  }

  async sendPushAlert(alertData) {
    // Simulate push notification
    const notification = {
      title: '🚨 Security Alert',
      body: `${alertData.type} detected on your account`,
      data: {
        alertId: alertData.id,
        type: alertData.type,
        severity: alertData.severity
      }
    };

    console.log(`🔔 [PUSH ALERT] Sending push notification: ${notification.title}`);

    return {
      notificationId: `push_${Date.now()}`,
      title: notification.title,
      body: notification.body,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
  }

  async executeAutomatedResponse(alertData) {
    const responses = [];

    // High severity alerts trigger automatic responses
    if (alertData.severity === 'high' || alertData.severity === 'critical') {
      
      // Lock account for critical security alerts
      if (alertData.type === 'failed_logins' && alertData.severity === 'critical') {
        await this.temporaryAccountLock(alertData.user_id, '30 minutes');
        responses.push('temporary_account_lock');
      }

      // Invalidate sessions for certain alert types
      if (['unknown_device', 'suspicious_patterns'].includes(alertData.type)) {
        await this.invalidateUserSessions(alertData.user_id);
        responses.push('session_invalidation');
      }

      // Require immediate 2FA verification
      if (alertData.type === 'unusual_location') {
        await this.requireImmediate2FA(alertData.user_id);
        responses.push('require_2fa_verification');
      }
    }

    alertData.actions_taken = responses;
    return responses;
  }

  async temporaryAccountLock(userId, duration) {
    console.log(`🔒 [AUTO RESPONSE] Temporarily locking account ${userId} for ${duration}`);
    
    // Implementation would set account lock in database
    const defenseLogQuery = `
      INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve) => {
      database.getDB().run(defenseLogQuery, [
        'automated_account_lock',
        userId,
        'security_alert',
        `Account temporarily locked for ${duration}`,
        'account_secured'
      ], () => resolve());
    });
  }

  async invalidateUserSessions(userId) {
    console.log(`🚪 [AUTO RESPONSE] Invalidating all sessions for user ${userId}`);
    
    const defenseLogQuery = `
      INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve) => {
      database.getDB().run(defenseLogQuery, [
        'automated_session_invalidation',
        userId,
        'security_alert',
        'All user sessions invalidated',
        'sessions_secured'
      ], () => resolve());
    });
  }

  async requireImmediate2FA(userId) {
    console.log(`🔐 [AUTO RESPONSE] Requiring immediate 2FA verification for user ${userId}`);
    
    const defenseLogQuery = `
      INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve) => {
      database.getDB().run(defenseLogQuery, [
        'automated_2fa_requirement',
        userId,
        'security_alert',
        'Immediate 2FA verification required',
        'additional_auth_required'
      ], () => resolve());
    });
  }

  async getUserEmail(userId) {
    if (!userId) return null;

    return new Promise((resolve, reject) => {
      const query = 'SELECT email FROM users WHERE id = ?';
      
      database.getDB().get(query, [userId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row ? row.email : null);
        }
      });
    });
  }

  async configureAlertThreshold(alertType, newThreshold) {
    this.alertThresholds[alertType] = newThreshold;
    
    console.log(`⚙️ [ALERT CONFIG] Updated threshold for ${alertType}: ${newThreshold}`);

    const defenseLogQuery = `
      INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve) => {
      database.getDB().run(defenseLogQuery, [
        'alert_threshold_config',
        null,
        'admin_configuration',
        `Alert threshold updated for ${alertType}: ${newThreshold}`,
        'configured'
      ], () => {
        resolve({
          alertType,
          newThreshold,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async simulateSecurityAlert(userId, alertType, simulatedDetails) {
    console.log(`🎭 [ALERT SIMULATION] Simulating ${alertType} alert for user ${userId}`);

    const alertData = await this.triggerAlert(alertType, userId, {
      ...simulatedDetails,
      simulation: true,
      test_mode: true
    }, 'medium');

    return {
      alertGenerated: true,
      alertId: alertData.id,
      alertType: alertData.type,
      channelsSent: alertData.channels_sent,
      actionsTaken: alertData.actions_taken,
      simulation_details: simulatedDetails,
      effectiveness: alertData.channels_sent.length > 0 ? 'successful' : 'partial'
    };
  }

  async getAlertStatistics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_alerts,
          json_extract(details, '$.type') as alert_type,
          json_extract(details, '$.severity') as severity,
          COUNT(CASE WHEN timestamp > ? THEN 1 END) as recent_alerts
        FROM security_events 
        WHERE event_type = 'security_alert'
        GROUP BY alert_type, severity
      `;

      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      
      database.getDB().all(query, [last24Hours], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const statistics = {
            overview: {
              totalAlerts: 0,
              recentAlerts: 0,
              alertTypes: {}
            },
            byType: {},
            bySeverity: {
              low: 0,
              medium: 0,
              high: 0,
              critical: 0
            },
            currentThresholds: this.alertThresholds,
            alertChannels: this.alertTypes
          };

          rows.forEach(row => {
            statistics.overview.totalAlerts += row.total_alerts;
            statistics.overview.recentAlerts += row.recent_alerts;
            
            const type = row.alert_type || 'unknown';
            const severity = row.severity || 'medium';
            
            if (!statistics.byType[type]) {
              statistics.byType[type] = 0;
            }
            statistics.byType[type] += row.total_alerts;
            
            statistics.bySeverity[severity] += row.total_alerts;
          });

          resolve(statistics);
        }
      });
    });
  }

  async getActiveAlerts(userId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT * FROM security_events 
        WHERE event_type = 'security_alert' 
        AND expires_at > ?
      `;
      const params = [Date.now()];

      if (userId) {
        query += ' AND identifier = ?';
        params.push(userId);
      }

      query += ' ORDER BY timestamp DESC';

      database.getDB().all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const alerts = rows.map(row => ({
            id: JSON.parse(row.details).id,
            type: JSON.parse(row.details).type,
            severity: JSON.parse(row.details).severity,
            timestamp: JSON.parse(row.details).timestamp,
            details: JSON.parse(row.details).details,
            status: JSON.parse(row.details).status,
            channels_sent: JSON.parse(row.details).channels_sent || [],
            actions_taken: JSON.parse(row.details).actions_taken || []
          }));
          
          resolve(alerts);
        }
      });
    });
  }
  async updateConfiguration(newConfig) {
    // Update notification channels
    if (newConfig.emailAlerts !== undefined) {
      this.notificationChannels.email.enabled = newConfig.emailAlerts;
    }
    
    if (newConfig.smsAlerts !== undefined) {
      this.notificationChannels.sms.enabled = newConfig.smsAlerts;
    }
    
    // Update alert thresholds
    if (newConfig.threshold) {
      Object.keys(this.alertThresholds).forEach(key => {
        this.alertThresholds[key] = newConfig.threshold;
      });
    }

    console.log(`⚙️ [ALERT SYSTEM] Configuration updated:`, newConfig);
    
    return {
      success: true,
      config: {
        emailAlerts: this.notificationChannels.email.enabled,
        smsAlerts: this.notificationChannels.sms.enabled,
        threshold: newConfig.threshold || Object.values(this.alertThresholds)[0],
        enabled: true
      },
      timestamp: new Date().toISOString()
    };
  }

  async getCurrentConfiguration() {
    return {
      enabled: true,
      emailAlerts: this.notificationChannels.email.enabled,
      smsAlerts: this.notificationChannels.sms.enabled,
      webhookAlerts: this.notificationChannels.webhook.enabled,
      thresholds: this.alertThresholds,
      channels: this.notificationChannels,
      automatedResponses: this.automatedResponses
    };
  }

  async getRecentAlerts(userId = null, limit = 50) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          json_extract(details, '$.id') as alert_id,
          json_extract(details, '$.type') as alert_type,
          json_extract(details, '$.severity') as severity,
          json_extract(details, '$.description') as description,
          json_extract(details, '$.user_id') as user_id,
          json_extract(details, '$.channels_sent') as channels_sent,
          timestamp,
          expires_at
        FROM security_events 
        WHERE event_type = 'security_alert'
      `;
      
      const params = [];
      
      if (userId) {
        query += ` AND json_extract(details, '$.user_id') = ?`;
        params.push(userId.toString());
      }
      
      query += ` ORDER BY timestamp DESC LIMIT ?`;
      params.push(limit);
      
      database.getDB().all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const alerts = rows.map(row => ({
            id: row.alert_id,
            type: row.alert_type,
            severity: row.severity,
            description: row.description,
            user_id: row.user_id,
            channels_sent: JSON.parse(row.channels_sent || '[]'),
            timestamp: new Date(row.timestamp).toISOString(),
            expires_at: new Date(row.expires_at).toISOString()
          }));
          resolve(alerts);
        }
      });
    });
  }

  async acknowledgeAlert(alertId, userId) {
    return new Promise((resolve, reject) => {
      const updateQuery = `
        UPDATE security_events 
        SET details = json_patch(details, json('{"acknowledged": true, "acknowledged_by": "' || ? || '", "acknowledged_at": "' || datetime('now') || '"}'))
        WHERE json_extract(details, '$.id') = ?
      `;
      
      database.getDB().run(updateQuery, [userId, alertId], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`✅ [ALERT SYSTEM] Alert ${alertId} acknowledged by user ${userId}`);
          
          // Log acknowledgment
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'alert_acknowledgment',
            userId,
            'user_action',
            `Alert ${alertId} acknowledged`,
            'acknowledged'
          ], () => {
            resolve({
              success: true,
              alertId,
              acknowledgedBy: userId,
              timestamp: new Date().toISOString()
            });
          });
        }
      });
    });
  }

  async getAlertMetrics(timeRange = '24h') {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const since = Date.now() - (timeRangeMs[timeRange] || timeRangeMs['24h']);

    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_alerts,
          COUNT(CASE WHEN json_extract(details, '$.severity') = 'critical' THEN 1 END) as critical_alerts,
          COUNT(CASE WHEN json_extract(details, '$.severity') = 'high' THEN 1 END) as high_alerts,
          COUNT(CASE WHEN json_extract(details, '$.severity') = 'medium' THEN 1 END) as medium_alerts,
          COUNT(CASE WHEN json_extract(details, '$.severity') = 'low' THEN 1 END) as low_alerts,
          COUNT(CASE WHEN json_extract(details, '$.acknowledged') = 'true' THEN 1 END) as acknowledged_alerts,
          COUNT(DISTINCT json_extract(details, '$.user_id')) as affected_users,
          json_extract(details, '$.type') as most_common_type
        FROM security_events 
        WHERE event_type = 'security_alert' AND timestamp > ?
        GROUP BY json_extract(details, '$.type')
        ORDER BY COUNT(*) DESC
        LIMIT 1
      `;
      
      database.getDB().get(query, [since], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            timeRange,
            totalAlerts: row?.total_alerts || 0,
            criticalAlerts: row?.critical_alerts || 0,
            highAlerts: row?.high_alerts || 0,
            mediumAlerts: row?.medium_alerts || 0,
            lowAlerts: row?.low_alerts || 0,
            acknowledgedAlerts: row?.acknowledged_alerts || 0,
            affectedUsers: row?.affected_users || 0,
            mostCommonType: row?.most_common_type || 'none',
            acknowledgeRate: row?.total_alerts > 0 ? 
              Math.round((row?.acknowledged_alerts / row?.total_alerts) * 100) : 0,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  async simulateTest(userId) {
    return new Promise((resolve, reject) => {
      console.log(`🧪 [ALERT SYSTEM TEST] Running alert system test for user ${userId}`);
      
      // Trigger a test alert
      this.triggerAlert('manual_test', userId, {
        alertType: 'test_alert',
        severity: 'low',
        description: 'Manual alert system test triggered',
        timestamp: new Date().toISOString()
      });
      
      // Log test in defense logs
      const defenseLogQuery = `
        INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      database.getDB().run(defenseLogQuery, [
        this.defenseType,
        userId,
        'manual_test',
        'Alert system defense simulation executed',
        'medium'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            testResult: 'Alert system test completed successfully',
            effectiveness: 'medium',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  async getCurrentConfiguration() {
    return {
      alertThresholds: this.alertThresholds,
      alertTypes: this.alertTypes,
      enabled: true,
      timestamp: new Date().toISOString()
    };
  }

  async acknowledgeAlert(alertId, userId) {
    return new Promise((resolve, reject) => {
      // Update alert as acknowledged
      const query = `
        UPDATE security_events 
        SET details = json_set(details, '$.acknowledged', 'true', '$.acknowledged_by', ?, '$.acknowledged_at', ?)
        WHERE id = ? OR json_extract(details, '$.id') = ?
      `;
      
      database.getDB().run(query, [userId, new Date().toISOString(), alertId, alertId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            success: true,
            alertId,
            acknowledgedBy: userId,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }
}

module.exports = AlertSystem;