const database = require('../models/database');
const crypto = require('crypto');

class ReplayAttack {
  constructor() {
    this.attackType = 'replay';
  }

  async initiate(options) {
    const { method, targetType, capturedToken, replayAttempts, attackerId } = options;
    const attackId = crypto.randomUUID();
    
    const attackData = {
      method: method || 'otp_replay',
      target_type: targetType || 'totp_token',
      captured_token: capturedToken || '123456',
      replay_attempts: replayAttempts || 3,
      capture_techniques: this.getCaptureMethodDetails(method),
      replay_window: this.calculateReplayWindow(),
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO attack_logs (id, attack_type, target_user_id, attacker_ip, attack_data, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      database.getDB().run(query, [
        attackId,
        this.attackType,
        null,
        'simulated-replay-attacker',
        JSON.stringify(attackData),
        'initiated'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🔄 [REPLAY ATTACK] Initiated with method: ${method}`);
          console.log(`🎯 Target Type: ${targetType}`);
          console.log(`🔑 Captured Token: ${capturedToken}`);
          console.log(`🔢 Replay Attempts: ${replayAttempts}`);
          console.log(`⏱️ Replay Window: ${attackData.replay_window.duration}`);
          
          resolve({
            attackId,
            status: 'initiated',
            replay_window: attackData.replay_window
          });
        }
      });
    });
  }

  getCaptureMethodDetails(method) {
    const methods = {
      'network_sniffing': {
        description: 'Captured OTP through network traffic analysis',
        tools: ['Wireshark', 'tcpdump', 'Burp Suite'],
        difficulty: 'Medium',
        prerequisites: ['Network access', 'Traffic interception capability']
      },
      'social_engineering': {
        description: 'Obtained OTP through social engineering techniques',
        tools: ['Phone calls', 'Phishing emails', 'Impersonation'],
        difficulty: 'Easy',
        prerequisites: ['Target information', 'Communication access']
      },
      'malware': {
        description: 'Captured OTP using malware on target device',
        tools: ['Keylogger', 'SMS interceptor', 'Screen capture'],
        difficulty: 'Hard',
        prerequisites: ['Device access', 'Malware deployment']
      },
      'shoulder_surfing': {
        description: 'Visually captured OTP by observing target',
        tools: ['Physical observation', 'Camera/recording'],
        difficulty: 'Easy',
        prerequisites: ['Physical proximity', 'Visual access']
      },
      'database_breach': {
        description: 'Obtained OTP from compromised database',
        tools: ['SQL injection', 'Database access', 'Internal breach'],
        difficulty: 'Very Hard',
        prerequisites: ['System access', 'Database privileges']
      }
    };

    return methods[method] || methods['network_sniffing'];
  }

  calculateReplayWindow() {
    // Most OTP codes have a limited validity window
    const now = new Date();
    const validityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    return {
      captured_at: now.toISOString(),
      expires_at: new Date(now.getTime() + validityPeriod).toISOString(),
      duration: '5 minutes',
      time_remaining: validityPeriod,
      success_probability: this.calculateSuccessProbability(validityPeriod)
    };
  }

  calculateSuccessProbability(timeRemaining) {
    // Success probability decreases over time
    const maxTime = 5 * 60 * 1000; // 5 minutes
    const remaining = Math.max(0, timeRemaining);
    const probability = (remaining / maxTime) * 100;
    
    return {
      percentage: Math.round(probability),
      factors: [
        'OTP expiration time',
        'Target session activity',
        'Rate limiting protections',
        'Replay detection mechanisms'
      ]
    };
  }

  async executeReplay(attackId) {
    return new Promise((resolve, reject) => {
      // Get attack data first
      const getQuery = 'SELECT attack_data FROM attack_logs WHERE id = ?';
      
      database.getDB().get(getQuery, [attackId], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          reject(new Error('Attack not found'));
          return;
        }

        const attackData = JSON.parse(row.attack_data);
        const replayResult = this.simulateReplay(attackData);

        console.log(`🔄 [REPLAY EXECUTION] Attack ID: ${attackId}`);
        console.log(`⚡ Method: ${attackData.capture_method}`);
        console.log(`📊 Result: ${replayResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`💡 Reason: ${replayResult.reason}`);

        // Update attack with replay results
        const updateQuery = `
          UPDATE attack_logs 
          SET status = ?,
              attack_data = json_patch(attack_data, json('{"replay_execution": ' || json(?) || ', "completed_at": "' || datetime('now') || '"}'))
          WHERE id = ?
        `;

        database.getDB().run(updateQuery, [
          replayResult.success ? 'successful' : 'failed',
          JSON.stringify(replayResult),
          attackId
        ], function(updateErr) {
          if (updateErr) {
            reject(updateErr);
          } else {
            // Log security event
            const eventSeverity = replayResult.success ? 'high' : 'medium';
            const eventDescription = replayResult.success ? 
              'Replay attack successful - OTP code bypassed' : 
              'Replay attack detected and blocked';

            const securityEventQuery = `
              INSERT INTO security_events (event_type, severity, description, metadata)
              VALUES (?, ?, ?, ?)
            `;
            
            database.getDB().run(securityEventQuery, [
              'replay_attack',
              eventSeverity,
              eventDescription,
              JSON.stringify({ 
                attack_id: attackId, 
                success: replayResult.success,
                method: attackData.capture_method,
                timestamp: new Date().toISOString()
              })
            ], () => {
              resolve({
                success: replayResult.success,
                attack_id: attackId,
                replay_details: replayResult,
                security_impact: replayResult.success ? 
                  'HIGH - Authentication bypass achieved' : 
                  'LOW - Attack detected and prevented'
              });
            });
          }
        });
      });
    });
  }

  simulateReplay(attackData) {
    const now = new Date();
    const expiresAt = new Date(attackData.replay_window.expires_at);
    const timeElapsed = now.getTime() - new Date(attackData.replay_window.captured_at).getTime();
    
    // Factors that affect replay success
    const factors = {
      time_expired: now > expiresAt,
      rate_limiting: Math.random() < 0.3, // 30% chance of rate limiting
      replay_detection: Math.random() < 0.4, // 40% chance of replay detection
      session_invalidated: Math.random() < 0.2, // 20% chance session is invalidated
      otp_already_used: Math.random() < 0.6 // 60% chance OTP was already consumed
    };

    let success = true;
    let reason = 'Replay attack successful';
    let defenseTriggered = [];

    // Check each defensive factor
    if (factors.time_expired) {
      success = false;
      reason = 'OTP code has expired';
      defenseTriggered.push('OTP expiration');
    } else if (factors.otp_already_used) {
      success = false;
      reason = 'OTP code has already been used';
      defenseTriggered.push('OTP single-use policy');
    } else if (factors.replay_detection) {
      success = false;
      reason = 'Replay attack detected by security systems';
      defenseTriggered.push('Replay detection mechanism');
    } else if (factors.rate_limiting) {
      success = false;
      reason = 'Rate limiting prevented multiple authentication attempts';
      defenseTriggered.push('Rate limiting');
    } else if (factors.session_invalidated) {
      success = false;
      reason = 'Target session has been invalidated';
      defenseTriggered.push('Session management');
    }

    return {
      success,
      reason,
      defenses_triggered: defenseTriggered,
      time_elapsed: `${Math.round(timeElapsed / 1000)} seconds`,
      execution_timestamp: now.toISOString(),
      detailed_analysis: {
        capture_method: attackData.capture_method,
        replay_window_used: `${Math.round((timeElapsed / (5 * 60 * 1000)) * 100)}%`,
        defensive_factors: factors
      },
      recommendations: success ? [
        'Implement shorter OTP expiration times',
        'Add replay detection mechanisms',
        'Implement device binding',
        'Use time-based session invalidation',
        'Add behavioral analysis'
      ] : [
        'Defense mechanisms working correctly',
        'Continue monitoring for attack patterns',
        'Review security logs for anomalies'
      ]
    };
  }

  async getReplayStatistics(timeframe = '24h') {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_attempts,
          SUM(CASE WHEN status = 'successful' THEN 1 ELSE 0 END) as successful_replays,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_replays,
          json_group_array(json_extract(attack_data, '$.capture_method')) as methods_used
        FROM attack_logs 
        WHERE attack_type = 'replay' 
        AND created_at > datetime('now', '-1 day')
      `;

      database.getDB().get(query, [], (err, row) => {
        if (err) {
          reject(err);
        } else {
          const methodsUsed = JSON.parse(row.methods_used || '[]');
          const methodStats = methodsUsed.reduce((acc, method) => {
            acc[method] = (acc[method] || 0) + 1;
            return acc;
          }, {});

          resolve({
            timeframe,
            total_attempts: row.total_attempts,
            successful_replays: row.successful_replays,
            failed_replays: row.failed_replays,
            success_rate: row.total_attempts > 0 ? 
              `${Math.round((row.successful_replays / row.total_attempts) * 100)}%` : '0%',
            methods_used: methodStats,
            security_effectiveness: row.failed_replays > row.successful_replays ? 'Good' : 'Needs Improvement'
          });
        }
      });
    });
  }

  async getResults(attackId) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM attack_logs WHERE id = ?`;
      
      database.getDB().get(query, [attackId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Attack not found'));
        } else {
          const attackData = JSON.parse(row.attack_data);
          resolve({
            attack_id: attackId,
            status: 'failed', // Replay attacks should typically fail due to defenses
            attempts_made: attackData.replay_attempts || 3,
            success_count: 0,
            failure_reasons: [
              'Token already used',
              'Token expired',
              'Rate limiting activated'
            ],
            defense_triggered: true,
            captured_token: attackData.captured_token,
            method: attackData.method,
            target_type: attackData.target_type
          });
        }
      });
    });
  }
}

module.exports = ReplayAttack;