const database = require('../models/database');
const crypto = require('crypto');

class SIMSwapAttack {
  constructor() {
    this.attackType = 'sim_swap';
  }

  async initiate(options) {
    const { targetPhoneNumber, carrierInfo, method, attackerDevice, attackerId } = options;
    const attackId = crypto.randomUUID();
    
    const attackData = {
      target_phone: targetPhoneNumber,
      carrier: carrierInfo,
      method: method || 'social_engineering',
      attacker_device: attackerDevice,
      social_engineering_phase: 'initiated',
      attack_timeline: this.generateTimeline(),
      created_at: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO attack_logs (id, attack_type, target_user_id, attacker_ip, attack_data, status, attack_details, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.getDB().run(query, [
        attackId,
        this.attackType,
        null, // We'll find user by phone if needed
        'simulated-attacker',
        JSON.stringify(attackData),
        'initiated',
        `SIM Swap Attack - ${method} against ${targetPhoneNumber}`,
        0 // Will be updated when attack succeeds
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log(`📱 [SIM SWAP ATTACK] Initiated against: ${targetPhoneNumber}`);
          console.log(`🏢 Target Carrier: ${carrierInfo}`);
          console.log(`🔧 Attack Method: ${method}`);
          console.log(`📱 Attacker Device: ${attackerDevice}`);
          console.log(`⏰ Estimated completion time: ${attackData.attack_timeline.phase_2_social_engineering.estimated_completion}`);
          
          resolve({
            attackId,
            status: 'initiated',
            timeline: attackData.attack_timeline,
            estimatedCompletion: attackData.attack_timeline.phase_2_social_engineering.estimated_completion
          });
        }
      });
    });
  }

  generateTimeline() {
    const now = new Date();
    return {
      phase_1_reconnaissance: {
        status: 'completed',
        description: 'Gather personal information about target',
        duration: '1-2 days',
        completion_time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      phase_2_social_engineering: {
        status: 'in_progress',
        description: 'Contact carrier pretending to be the victim',
        duration: '2-4 hours',
        estimated_completion: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
      },
      phase_3_sim_transfer: {
        status: 'pending',
        description: 'Request SIM card transfer to attacker-controlled number',
        duration: '30 minutes - 2 hours',
        estimated_start: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString()
      },
      phase_4_account_takeover: {
        status: 'pending',
        description: 'Use transferred number for account recovery and 2FA bypass',
        duration: '15-30 minutes',
        estimated_start: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString()
      }
    };
  }

  async executeSwap(attackId) {
    return new Promise((resolve, reject) => {
      // Simulate the SIM swap execution with realistic timing
      console.log(`📱 [SIM SWAP] Starting execution phase for attack ${attackId}`);
      
      // Update to in_progress
      this.updateAttackPhase(attackId, 'in_progress', 'Contacting carrier support');
      
      setTimeout(async () => {
        const swapData = {
          swap_executed: true,
          new_sim_id: crypto.randomBytes(8).toString('hex').toUpperCase(),
          carrier_response: 'SIM card successfully transferred to new device',
          attacker_control: true,
          timestamp: new Date().toISOString(),
          social_engineering_success: true,
          verification_bypassed: true,
          next_steps: [
            'All SMS messages now redirected to attacker device',
            'SMS-based 2FA codes intercepted',
            'Account recovery attempts can bypass phone verification',
            'Target loses access to phone-based services'
          ],
          security_impact: {
            severity: 'CRITICAL',
            affected_services: ['Banking apps', 'Email accounts', 'Social media', 'Any service using SMS 2FA'],
            recovery_difficulty: 'HIGH - Requires contacting carrier and proving identity'
          }
        };

        console.log(`📱 [SIM SWAP EXECUTED] Attack ID: ${attackId}`);
        console.log(`🆔 New SIM ID: ${swapData.new_sim_id}`);
        console.log(`✅ Attacker now controls target phone number`);

        // Update attack status
        const query = `
          UPDATE attack_logs 
          SET status = 'successful',
              success = 1,
              attack_data = json_patch(attack_data, json('{"swap_execution": ' || json(?) || ', "completed_at": "' || datetime('now') || '"}'))
          WHERE id = ?
        `;

        database.getDB().run(query, [JSON.stringify(swapData), attackId], function(err) {
          if (err) {
            reject(err);
          } else {
            // Log high-severity security event
            const securityEventQuery = `
              INSERT INTO security_events (event_type, severity, description, metadata)
              VALUES (?, ?, ?, ?)
            `;
            
            database.getDB().run(securityEventQuery, [
              'sim_swap_success',
              'critical',
              'SIM swap attack successfully executed - phone number compromised',
              JSON.stringify({ 
                attack_id: attackId, 
                new_sim_id: swapData.new_sim_id,
                timestamp: swapData.timestamp 
              })
            ], () => {
              resolve({
                success: true,
                attack_id: attackId,
                swap_details: swapData,
                security_impact: 'CRITICAL - All SMS-based 2FA compromised'
              });
            });
          }
        });
      }, parseInt(process.env.SIM_SWAP_DELAY) || 5000); // 5 second delay to simulate processing
    });
  }

  async simulateSMSInterception(attackId, targetService) {
    return new Promise((resolve) => {
      // Simulate intercepting SMS 2FA codes after successful SIM swap
      const interceptedSMS = {
        service: targetService || 'Generic Banking App',
        sms_content: `Your verification code is: ${Math.floor(100000 + Math.random() * 900000)}`,
        intercepted_at: new Date().toISOString(),
        original_destination: 'victim_phone',
        redirected_to: 'attacker_phone'
      };

      console.log(`📨 [SMS INTERCEPTED] Service: ${interceptedSMS.service}`);
      console.log(`🔢 Code: ${interceptedSMS.sms_content.match(/\d{6}/)[0]}`);

      // Update attack data with intercepted SMS
      const query = `
        UPDATE attack_logs 
        SET attack_data = json_patch(attack_data, json('{"intercepted_sms": ' || json(?) || '}'))
        WHERE id = ?
      `;

      database.getDB().run(query, [JSON.stringify(interceptedSMS), attackId], () => {
        resolve({
          success: true,
          intercepted_sms: interceptedSMS,
          attack_progression: 'SMS 2FA codes now accessible to attacker'
        });
      });
    });
  }

  async simulateAccountTakeover(attackId, targetAccounts) {
    return new Promise((resolve) => {
      const takeoverResults = targetAccounts.map(account => ({
        service: account,
        takeover_method: 'SMS-based password reset',
        success: Math.random() > 0.3, // 70% success rate
        timestamp: new Date().toISOString(),
        access_level: 'full_account_access'
      }));

      console.log(`🎯 [ACCOUNT TAKEOVER] Attempting takeover of ${targetAccounts.length} accounts`);
      
      const successfulTakeovers = takeoverResults.filter(result => result.success);
      console.log(`✅ Successfully compromised: ${successfulTakeovers.length}/${targetAccounts.length} accounts`);

      // Update attack data
      const query = `
        UPDATE attack_logs 
        SET attack_data = json_patch(attack_data, json('{"account_takeovers": ' || json(?) || '}'))
        WHERE id = ?
      `;

      database.getDB().run(query, [JSON.stringify(takeoverResults), attackId], () => {
        resolve({
          success: true,
          takeover_results: takeoverResults,
          successful_takeovers: successfulTakeovers.length,
          total_attempts: targetAccounts.length
        });
      });
    });
  }

  async getAttackProgress(attackId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM attack_logs WHERE id = ?';
      
      database.getDB().get(query, [attackId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const attackData = JSON.parse(row.attack_data);
          resolve({
            attack_id: attackId,
            status: row.status,
            timeline: attackData.attack_timeline,
            current_phase: this.getCurrentPhase(attackData.attack_timeline),
            swap_executed: attackData.swap_execution ? true : false,
            sms_intercepted: attackData.intercepted_sms ? true : false,
            accounts_compromised: attackData.account_takeovers ? 
              attackData.account_takeovers.filter(t => t.success).length : 0
          });
        } else {
          reject(new Error('Attack not found'));
        }
      });
    });
  }

  getCurrentPhase(timeline) {
    for (const [phase, details] of Object.entries(timeline)) {
      if (details.status === 'in_progress') {
        return { phase, details };
      }
    }
    return { phase: 'completed', details: { description: 'All phases completed' } };
  }

  async getInterceptedSMS(attackId) {
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
            intercepted_sms: [
              {
                from: "2FA-LAB",
                message: "Your verification code is: 123456",
                timestamp: new Date().toISOString(),
                intercepted: true
              },
              {
                from: "BANK-ALERT",
                message: "Login attempt detected. Code: 789012",
                timestamp: new Date().toISOString(),
                intercepted: true
              }
            ],
            sim_status: "transferred",
            carrier_response: attackData.carrier || "Simulated Carrier"
          });
        }
      });
    });
  }

  updateAttackPhase(attackId, status, description) {
    const updateQuery = `
      UPDATE attack_logs 
      SET status = ?,
          attack_data = json_patch(attack_data, json('{"current_phase": "' || ? || '", "last_update": "' || datetime('now') || '"}'))
      WHERE id = ?
    `;
    
    database.getDB().run(updateQuery, [status, description, attackId], (err) => {
      if (err) {
        console.error('Error updating attack phase:', err);
      } else {
        console.log(`📱 [SIM SWAP] ${attackId}: ${status} - ${description}`);
      }
    });
  }

  async getStatus(attackId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          id,
          status,
          attack_data,
          success,
          created_at,
          updated_at
        FROM attack_logs 
        WHERE id = ?
      `;

      database.getDB().get(query, [attackId], (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Attack not found'));
        } else {
          const attackData = JSON.parse(row.attack_data);
          
          resolve({
            attackId: row.id,
            status: row.status,
            success: row.success === 1,
            targetPhone: attackData.target_phone,
            carrier: attackData.carrier,
            method: attackData.method,
            timeline: attackData.attack_timeline,
            currentPhase: attackData.current_phase || 'Social Engineering',
            swapExecuted: attackData.swap_execution?.swap_executed || false,
            newSimId: attackData.swap_execution?.new_sim_id || null,
            created_at: row.created_at,
            lastUpdate: attackData.last_update,
            securityImpact: attackData.swap_execution?.security_impact || null
          });
        }
      });
    });
  }
}

module.exports = SIMSwapAttack;