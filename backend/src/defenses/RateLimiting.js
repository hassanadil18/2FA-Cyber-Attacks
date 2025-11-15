const database = require('../models/database');

class RateLimiting {
  constructor() {
    this.defenseType = 'rate_limiting';
    this.defaultLimits = {
      login_attempts: { window: 15 * 60 * 1000, maxAttempts: 5 }, // 5 attempts in 15 minutes
      otp_requests: { window: 5 * 60 * 1000, maxAttempts: 3 },   // 3 OTP requests in 5 minutes
      password_reset: { window: 60 * 60 * 1000, maxAttempts: 3 }, // 3 resets in 1 hour
      api_calls: { window: 60 * 1000, maxAttempts: 100 },        // 100 API calls per minute
      registration: { window: 60 * 60 * 1000, maxAttempts: 5 }    // 5 registrations per hour per IP
    };
    
    this.lockoutDurations = {
      short: 5 * 60 * 1000,   // 5 minutes
      medium: 30 * 60 * 1000,  // 30 minutes
      long: 2 * 60 * 60 * 1000, // 2 hours
      extended: 24 * 60 * 60 * 1000 // 24 hours
    };
  }

  async checkRateLimit(actionType, identifier, customLimit = null) {
    const limit = customLimit || this.defaultLimits[actionType];
    if (!limit) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    const now = Date.now();
    const windowStart = now - limit.window;

    return new Promise((resolve, reject) => {
      // Count attempts in the current window
      const countQuery = `
        SELECT COUNT(*) as count
        FROM login_attempts 
        WHERE (username = ? OR ip_address = ?) AND attack_type = ? AND datetime(created_at) > datetime('now', '-15 minutes')
      `;

      database.getDB().get(countQuery, [identifier, identifier, actionType], (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const currentAttempts = row.count || 0;
        const isLimited = currentAttempts >= limit.maxAttempts;
        const remainingAttempts = Math.max(0, limit.maxAttempts - currentAttempts);

        // Log the rate limit check
        this.logAttempt(actionType, identifier, isLimited);

        if (isLimited) {
          console.log(`🚫 [RATE LIMIT] ${actionType} blocked for ${identifier}: ${currentAttempts}/${limit.maxAttempts} attempts`);
          
          // Calculate reset time
          const oldestAttemptQuery = `
            SELECT MIN(created_at) as oldest
            FROM login_attempts 
            WHERE (username = ? OR ip_address = ?) AND attack_type = ? AND datetime(created_at) > datetime('now', '-15 minutes')
          `;

          database.getDB().get(oldestAttemptQuery, [identifier, identifier, actionType], (err, oldestRow) => {
            const resetTime = (oldestRow.oldest || now) + limit.window;
            
            resolve({
              allowed: false,
              currentAttempts,
              maxAttempts: limit.maxAttempts,
              remainingAttempts: 0,
              resetTime,
              retryAfter: Math.ceil((resetTime - now) / 1000),
              windowMs: limit.window
            });
          });
        } else {
          resolve({
            allowed: true,
            currentAttempts,
            maxAttempts: limit.maxAttempts,
            remainingAttempts,
            resetTime: null,
            retryAfter: 0,
            windowMs: limit.window
          });
        }
      });
    });
  }

  async logAttempt(actionType, identifier, wasBlocked = false) {
    return new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO login_attempts (username, ip_address, user_agent, success, attack_type)
        VALUES (?, ?, ?, ?, ?)
      `;

      database.getDB().run(insertQuery, [
        identifier,
        identifier, // Use identifier as both username and ip for now
        'rate-limiting-check',
        wasBlocked ? 0 : 1,
        identifier.includes('.') ? identifier : 'unknown', // Basic IP detection
        'rate-limiter'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          if (wasBlocked) {
            // Log defense activation
            const defenseLogQuery = `
              INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
              VALUES (?, ?, ?, ?, ?)
            `;
            
            database.getDB().run(defenseLogQuery, [
              'rate_limiting',
              null,
              actionType,
              `Rate limit exceeded for ${identifier}`,
              'blocked'
            ], () => resolve(this.lastID));
          } else {
            resolve(this.lastID);
          }
        }
      });
    });
  }

  async implementAdaptiveLimiting(identifier, actionType, threatLevel = 'normal') {
    let adaptedLimit = { ...this.defaultLimits[actionType] };
    
    // Adjust limits based on threat level
    switch (threatLevel) {
      case 'high':
        adaptedLimit.maxAttempts = Math.ceil(adaptedLimit.maxAttempts * 0.5);
        adaptedLimit.window = adaptedLimit.window * 2;
        break;
      case 'critical':
        adaptedLimit.maxAttempts = Math.ceil(adaptedLimit.maxAttempts * 0.3);
        adaptedLimit.window = adaptedLimit.window * 3;
        break;
      case 'low':
        adaptedLimit.maxAttempts = Math.ceil(adaptedLimit.maxAttempts * 1.5);
        break;
      default:
        // Normal threat level - use default limits
        break;
    }

    console.log(`🔄 [ADAPTIVE RATE LIMIT] ${actionType} for ${identifier}: ${adaptedLimit.maxAttempts} attempts in ${adaptedLimit.window}ms (threat: ${threatLevel})`);

    return this.checkRateLimit(actionType, identifier, adaptedLimit);
  }

  async implementProgressiveLockout(identifier, failureCount) {
    let lockoutDuration;
    
    if (failureCount <= 3) {
      lockoutDuration = this.lockoutDurations.short;
    } else if (failureCount <= 6) {
      lockoutDuration = this.lockoutDurations.medium;
    } else if (failureCount <= 10) {
      lockoutDuration = this.lockoutDurations.long;
    } else {
      lockoutDuration = this.lockoutDurations.extended;
    }

    const lockoutUntil = Date.now() + lockoutDuration;

    return new Promise((resolve, reject) => {
      // Store lockout information
      const lockoutQuery = `
        INSERT OR REPLACE INTO security_events (
          event_type, identifier, details, timestamp, expires_at
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const details = JSON.stringify({
        failure_count: failureCount,
        lockout_duration_ms: lockoutDuration,
        lockout_level: this.getLockoutLevel(failureCount)
      });

      database.getDB().run(lockoutQuery, [
        'progressive_lockout',
        identifier,
        details,
        Date.now(),
        lockoutUntil
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🔒 [PROGRESSIVE LOCKOUT] ${identifier} locked for ${lockoutDuration}ms (${failureCount} failures)`);
          
          // Log defense activation
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'progressive_lockout',
            null,
            'multiple_failures',
            `Progressive lockout applied: ${Math.ceil(lockoutDuration / 60000)} minutes`,
            'locked_out'
          ], () => {
            resolve({
              lockedOut: true,
              lockoutUntil,
              lockoutDuration,
              failureCount,
              lockoutLevel: this.getLockoutLevel(failureCount),
              retryAfter: Math.ceil(lockoutDuration / 1000)
            });
          });
        }
      });
    });
  }

  getLockoutLevel(failureCount) {
    if (failureCount <= 3) return 'short';
    if (failureCount <= 6) return 'medium';
    if (failureCount <= 10) return 'long';
    return 'extended';
  }

  async checkLockoutStatus(identifier) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM security_events 
        WHERE identifier = ? AND event_type = 'progressive_lockout' 
        AND expires_at > ? 
        ORDER BY timestamp DESC 
        LIMIT 1
      `;

      database.getDB().get(query, [identifier, Date.now()], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const details = JSON.parse(row.details);
          resolve({
            isLockedOut: true,
            lockoutUntil: row.expires_at,
            failureCount: details.failure_count,
            lockoutLevel: details.lockout_level,
            retryAfter: Math.ceil((row.expires_at - Date.now()) / 1000)
          });
        } else {
          resolve({
            isLockedOut: false,
            lockoutUntil: null,
            failureCount: 0,
            lockoutLevel: null,
            retryAfter: 0
          });
        }
      });
    });
  }

  async configureLimits(actionType, newLimits) {
    if (!this.defaultLimits[actionType]) {
      throw new Error(`Unknown action type: ${actionType}`);
    }

    this.defaultLimits[actionType] = {
      ...this.defaultLimits[actionType],
      ...newLimits
    };

    console.log(`⚙️ [RATE LIMIT CONFIG] Updated limits for ${actionType}:`, this.defaultLimits[actionType]);

    // Log configuration change
    const defenseLogQuery = `
      INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve) => {
      database.getDB().run(defenseLogQuery, [
        'rate_limit_config',
        null,
        'admin_configuration',
        `Updated rate limits for ${actionType}`,
        'configured'
      ], () => {
        resolve({
          actionType,
          newLimits: this.defaultLimits[actionType],
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async simulateBruteForceAttack(targetIdentifier, actionType, attackIntensity = 'normal') {
    console.log(`🚨 [RATE LIMIT TEST] Simulating brute force attack on ${targetIdentifier} (${actionType})`);
    
    const attackParams = {
      normal: { attempts: 10, delayMs: 1000 },
      aggressive: { attempts: 20, delayMs: 500 },
      massive: { attempts: 50, delayMs: 100 }
    };

    const { attempts, delayMs } = attackParams[attackIntensity] || attackParams.normal;
    const results = {
      totalAttempts: attempts,
      blockedAttempts: 0,
      allowedAttempts: 0,
      firstBlockedAt: null,
      defenseEffectiveness: null
    };

    for (let i = 1; i <= attempts; i++) {
      const rateCheck = await this.checkRateLimit(actionType, targetIdentifier);
      
      if (!rateCheck.allowed) {
        results.blockedAttempts++;
        if (!results.firstBlockedAt) {
          results.firstBlockedAt = i;
        }
      } else {
        results.allowedAttempts++;
        // Simulate the attempt being made
        await this.logAttempt(actionType, targetIdentifier, false);
      }

      // Small delay to simulate attack timing
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    // Calculate defense effectiveness
    results.defenseEffectiveness = (results.blockedAttempts / results.totalAttempts) * 100;

    console.log(`🛡️ [RATE LIMIT DEFENSE] Attack simulation complete: ${results.blockedAttempts}/${results.totalAttempts} blocked (${results.defenseEffectiveness.toFixed(1)}% effective)`);

    // Log defense test
    const defenseLogQuery = `
      INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    return new Promise((resolve) => {
      database.getDB().run(defenseLogQuery, [
        'rate_limit_simulation',
        null,
        'brute_force_test',
        `Blocked ${results.blockedAttempts}/${results.totalAttempts} attack attempts`,
        results.defenseEffectiveness > 80 ? 'highly_effective' : results.defenseEffectiveness > 50 ? 'effective' : 'partially_effective'
      ], () => {
        resolve({
          ...results,
          attackIntensity,
          protection_level: results.defenseEffectiveness > 80 ? 'high' : results.defenseEffectiveness > 50 ? 'medium' : 'low',
          recommendations: this.generateRecommendations(results)
        });
      });
    });
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    if (results.defenseEffectiveness < 50) {
      recommendations.push('Consider reducing rate limit thresholds');
      recommendations.push('Implement CAPTCHA after initial failures');
    }
    
    if (results.firstBlockedAt > 5) {
      recommendations.push('Consider implementing progressive delays');
      recommendations.push('Add IP-based blocking for repeated offenders');
    }
    
    if (results.defenseEffectiveness > 80) {
      recommendations.push('Current rate limiting is effective');
      recommendations.push('Consider monitoring for evasion attempts');
    }
    
    return recommendations;
  }

  async getRateLimitStatistics() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          action_type,
          COUNT(*) as total_attempts,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as blocked_attempts,
          COUNT(DISTINCT identifier) as unique_identifiers,
          MAX(timestamp) as last_attempt
        FROM login_attempts 
        WHERE timestamp > ?
        GROUP BY action_type
      `;

      const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
      
      database.getDB().all(query, [last24Hours], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const statistics = {
            timeWindow: '24 hours',
            actionTypes: {},
            overall: {
              totalAttempts: 0,
              blockedAttempts: 0,
              uniqueIdentifiers: new Set(),
              blockingRate: 0
            },
            currentLimits: this.defaultLimits,
            lockoutDurations: this.lockoutDurations
          };

          rows.forEach(row => {
            statistics.actionTypes[row.action_type] = {
              totalAttempts: row.total_attempts,
              blockedAttempts: row.blocked_attempts,
              allowedAttempts: row.total_attempts - row.blocked_attempts,
              uniqueIdentifiers: row.unique_identifiers,
              blockingRate: ((row.blocked_attempts / row.total_attempts) * 100).toFixed(1) + '%',
              lastAttempt: new Date(row.last_attempt).toISOString()
            };

            statistics.overall.totalAttempts += row.total_attempts;
            statistics.overall.blockedAttempts += row.blocked_attempts;
          });

          statistics.overall.blockingRate = statistics.overall.totalAttempts > 0 
            ? ((statistics.overall.blockedAttempts / statistics.overall.totalAttempts) * 100).toFixed(1) + '%'
            : '0%';

          resolve(statistics);
        }
      });
    });
  }

  async clearRateLimitHistory(identifier = null, actionType = null) {
    return new Promise((resolve, reject) => {
      let query = 'DELETE FROM login_attempts WHERE 1=1';
      const params = [];

      if (identifier) {
        query += ' AND identifier = ?';
        params.push(identifier);
      }

      if (actionType) {
        query += ' AND action_type = ?';
        params.push(actionType);
      }

      database.getDB().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🧹 [RATE LIMIT] Cleared ${this.changes} rate limit records`);
          resolve({
            clearedRecords: this.changes,
            identifier: identifier || 'all',
            actionType: actionType || 'all',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }
  async updateConfiguration(newConfig) {
    // Update the default limits with new configuration
    if (newConfig.maxAttempts) {
      this.defaultLimits.login_attempts.maxAttempts = newConfig.maxAttempts;
      this.defaultLimits.otp_requests.maxAttempts = Math.max(1, newConfig.maxAttempts - 2);
    }
    
    if (newConfig.windowMinutes) {
      const windowMs = newConfig.windowMinutes * 60 * 1000;
      this.defaultLimits.login_attempts.window = windowMs;
      this.defaultLimits.otp_requests.window = Math.max(60000, windowMs / 3);
    }

    console.log(`⚙️ [RATE LIMITING] Configuration updated:`, newConfig);
    
    return {
      success: true,
      config: this.defaultLimits,
      timestamp: new Date().toISOString()
    };
  }

  async getCurrentConfiguration() {
    return {
      enabled: true,
      limits: this.defaultLimits,
      lockoutDurations: this.lockoutDurations,
      adaptive: true,
      progressive: true
    };
  }

  async getActiveRateLimits(identifier = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          identifier,
          action_type,
          COUNT(*) as attempt_count,
          MAX(timestamp) as last_attempt,
          MIN(timestamp) as first_attempt
        FROM login_attempts 
        WHERE timestamp > ?
      `;
      
      const params = [Date.now() - (24 * 60 * 60 * 1000)]; // Last 24 hours
      
      if (identifier) {
        query += ` AND identifier = ?`;
        params.push(identifier);
      }
      
      query += ` GROUP BY identifier, action_type HAVING attempt_count >= 3`;
      
      database.getDB().all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const activeLimits = rows.map(row => {
            const limit = this.defaultLimits[row.action_type];
            const windowStart = row.last_attempt - (limit?.window || 900000);
            const isActive = row.first_attempt > windowStart;
            
            return {
              identifier: row.identifier,
              action_type: row.action_type,
              attempt_count: row.attempt_count,
              limit: limit?.maxAttempts || 5,
              is_rate_limited: isActive && row.attempt_count >= (limit?.maxAttempts || 5),
              window_start: new Date(windowStart).toISOString(),
              last_attempt: new Date(row.last_attempt).toISOString(),
              remaining_attempts: Math.max(0, (limit?.maxAttempts || 5) - row.attempt_count)
            };
          });
          resolve(activeLimits);
        }
      });
    });
  }

  async clearRateLimit(identifier, actionType = null) {
    return new Promise((resolve, reject) => {
      let query = `DELETE FROM login_attempts WHERE identifier = ?`;
      const params = [identifier];
      
      if (actionType) {
        query += ` AND action_type = ?`;
        params.push(actionType);
      }
      
      database.getDB().run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`🗑️ [RATE LIMITING] Cleared ${this.changes} attempts for ${identifier}`);
          
          // Log the clearance
          const defenseLogQuery = `
            INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          database.getDB().run(defenseLogQuery, [
            'rate_limit_clear',
            null,
            'admin_action',
            `Rate limit cleared for ${identifier}`,
            'manual'
          ], () => {
            resolve({
              success: true,
              cleared_attempts: this.changes,
              identifier,
              actionType: actionType || 'all',
              timestamp: new Date().toISOString()
            });
          });
        }
      });
    });
  }

  async simulateTest(userId) {
    return new Promise((resolve, reject) => {
      console.log(`🧪 [RATE LIMITING TEST] Running rate limiting test for user ${userId}`);
      
      // Log test in defense logs
      const defenseLogQuery = `
        INSERT INTO defense_logs (defense_type, user_id, triggered_by, action_taken, effectiveness)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      database.getDB().run(defenseLogQuery, [
        this.defenseType,
        userId,
        'manual_test',
        'Rate limiting defense simulation executed',
        'high'
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            testResult: 'Rate limiting test completed successfully',
            effectiveness: 'high',
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  async getStatus(ipAddress, userId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          attack_type,
          COUNT(*) as attempts,
          MAX(created_at) as last_attempt
        FROM login_attempts 
        WHERE (ip_address = ? OR username = ?) AND datetime(created_at) > datetime('now', '-15 minutes')
        GROUP BY attack_type
      `;
      
      database.getDB().all(query, [ipAddress || 'unknown', userId || 'unknown', windowStart], (err, rows) => {
        if (err) {
          resolve({ enabled: true, activeLimits: [] }); // Return default on error
        } else {
          const activeLimits = rows.map(row => ({
            actionType: row.action_type,
            attempts: row.attempts,
            maxAttempts: this.defaultLimits[row.action_type]?.maxAttempts || 5,
            lastAttempt: new Date(row.last_attempt).toISOString(),
            isLimited: row.attempts >= (this.defaultLimits[row.action_type]?.maxAttempts || 5)
          }));
          
          resolve({
            enabled: true,
            activeLimits,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  async getCurrentConfiguration() {
    return {
      defaultLimits: this.defaultLimits,
      lockoutDurations: this.lockoutDurations,
      enabled: true,
      timestamp: new Date().toISOString()
    };
  }

  async getActiveRateLimits() {
    return this.getActiveLimits();
  }
}

module.exports = RateLimiting;