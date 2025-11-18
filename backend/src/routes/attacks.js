const express = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const PhishingAttack = require('../attacks/PhishingAttack');
const MITMAttack = require('../attacks/MITMAttack');
const SIMSwapAttack = require('../attacks/SIMSwapAttack');
const ReplayAttack = require('../attacks/ReplayAttack');

const router = express.Router();

// Direct attack routes (for frontend)
router.post('/phishing', authMiddleware, async (req, res) => {
  try {
    const { target_email, attack_type, template, domain } = req.body;
    
    if (!target_email) {
      return res.status(400).json({ error: 'Target email is required' });
    }

    console.log('🎣 Executing phishing attack with params:', { target_email, attack_type, template, domain });

    const attack = new PhishingAttack();
    const result = await attack.initiate({
      targetEmail: target_email,
      phishingDomain: domain || 'fake-2fa-lab.local',
      attackMethod: attack_type || 'credential_harvest',
      template: template || 'fake_login_page',
      attackerId: req.user.id
    });

    console.log('✅ Phishing attack result:', result);

    res.json({
      message: 'Phishing attack executed successfully',
      attack_id: result.attackId,
      status: 'completed',
      details: {
        fake_url: result.phishingUrl,
        email_template: template,
        target_email: target_email,
        attack_type: attack_type
      }
    });

  } catch (error) {
    console.error('❌ Phishing attack error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to execute phishing attack',
      details: error.message 
    });
  }
});

router.post('/mitm', authMiddleware, async (req, res) => {
  try {
    const { target_ip, method, interface: netInterface, ssl_strip } = req.body;
    
    console.log('🕵️ Executing MITM attack with params:', { target_ip, method, interface: netInterface, ssl_strip });

    const attack = new MITMAttack();
    const result = await attack.initiate({
      targetIp: target_ip || '192.168.1.100',
      method: method || 'arp_spoofing',
      interface: netInterface || 'eth0',
      sslStrip: ssl_strip || false,
      attackerId: req.user.id
    });

    console.log('✅ MITM attack result:', result);

    res.json({
      message: 'MITM attack executed successfully',
      attack_id: result.attackId,
      status: 'active',
      details: {
        proxy_port: result.proxyPort || 8080,
        target_ip: target_ip,
        method: method,
        ssl_strip_enabled: ssl_strip
      }
    });

  } catch (error) {
    console.error('❌ MITM attack error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to execute MITM attack',
      details: error.message 
    });
  }
});

router.post('/sim-swap', authMiddleware, async (req, res) => {
  try {
    const { target_phone, targetPhoneNumber, carrier, carrierInfo, method, attacker_device, attackerDevice } = req.body;
    
    const phoneNumber = target_phone || targetPhoneNumber;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Target phone number is required' });
    }

    console.log('📱 Executing SIM swap attack with params:', { phoneNumber, carrier: carrier || carrierInfo, method, attacker_device: attacker_device || attackerDevice });

    const attack = new SIMSwapAttack();
    const result = await attack.initiate({
      targetPhoneNumber: phoneNumber,
      carrierInfo: carrier || carrierInfo || 'Simulated Carrier',
      method: method || 'social_engineering',
      attackerDevice: attacker_device || attackerDevice,
      attackerId: req.user.id
    });

    console.log('✅ SIM swap attack result:', result);

    res.json({
      message: 'SIM swap attack executed successfully',
      attack_id: result.attackId,
      status: 'completed',
      details: {
        target_phone: target_phone,
        carrier: carrier,
        method: method,
        swap_successful: true,
        sms_redirected: true
      }
    });

  } catch (error) {
    console.error('❌ SIM swap attack error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to execute SIM swap attack',
      details: error.message 
    });
  }
});

router.post('/replay', authMiddleware, async (req, res) => {
  try {
    const { method, target_type, captured_token, replay_attempts, target_service, capture_method, session_type } = req.body;
    
    // Generate a simulated token if not provided for demonstration purposes
    const simulatedToken = captured_token || `SIMULATED_TOKEN_${Math.random().toString(36).substr(2, 9)}`;
    const targetType = target_type || session_type || 'totp_token';

    console.log('🔄 Executing replay attack with params:', { method, target_type: targetType, captured_token: simulatedToken, replay_attempts, target_service });
    
    const attack = new ReplayAttack();
    const result = await attack.initiate({
      method: method || capture_method || 'otp_replay',
      targetType: targetType,
      capturedToken: simulatedToken,
      replayAttempts: replay_attempts || 3,
      targetService: target_service,
      attackerId: req.user.id
    });

    console.log('✅ Replay attack result:', result);

    res.json({
      message: 'Replay attack executed',
      attack_id: result.attackId,
      status: 'failed', // Should typically fail due to defense mechanisms
      details: {
        method: method || capture_method,
        target_type: targetType,
        target_service: target_service,
        captured_token: simulatedToken,
        attempts_made: replay_attempts || 3,
        success_count: 0,
        failure_reason: 'Token already used or expired'
      }
    });

  } catch (error) {
    console.error('❌ Replay attack error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Failed to execute replay attack',
      details: error.message 
    });
  }
});

// Status check routes
router.get('/phishing/:attackId/status', authMiddleware, async (req, res) => {
  try {
    const attack = new PhishingAttack();
    const status = await attack.getStatus(req.params.attackId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get attack status' });
  }
});

router.get('/phishing/:attackId/status', authMiddleware, async (req, res) => {
  try {
    const attack = new PhishingAttack();
    const status = await attack.getStatus(req.params.attackId);
    res.json(status);
  } catch (error) {
    console.error('Phishing status error:', error);
    res.status(500).json({ error: 'Failed to get attack status', details: error.message });
  }
});

router.get('/mitm/:attackId/status', authMiddleware, async (req, res) => {
  try {
    const attack = new MITMAttack();
    const status = await attack.getStatus(req.params.attackId);
    res.json(status);
  } catch (error) {
    console.error('MITM status error:', error);
    res.status(500).json({ error: 'Failed to get attack status', details: error.message });
  }
});

router.get('/sim-swap/:attackId/status', authMiddleware, async (req, res) => {
  try {
    const attack = new SIMSwapAttack();
    const status = await attack.getStatus(req.params.attackId);
    res.json(status);
  } catch (error) {
    console.error('SIM swap status error:', error);
    res.status(500).json({ error: 'Failed to get attack status', details: error.message });
  }
});

router.get('/sim-swap/:attackId/sms', authMiddleware, async (req, res) => {
  try {
    const attack = new SIMSwapAttack();
    const smsData = await attack.getInterceptedSMS(req.params.attackId);
    res.json(smsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get SMS data' });
  }
});

router.get('/replay/:attackId/results', authMiddleware, async (req, res) => {
  try {
    const attack = new ReplayAttack();
    const results = await attack.getResults(req.params.attackId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get replay results' });
  }
});

// Legacy routes (keeping for backward compatibility)
// Phishing Attack Simulation
router.post('/phishing/initiate', authMiddleware, async (req, res) => {
  try {
    const { targetEmail, phishingDomain, attackMethod } = req.body;
    
    if (!targetEmail) {
      return res.status(400).json({ error: 'Target email is required' });
    }

    const attack = new PhishingAttack();
    const result = await attack.initiate({
      targetEmail,
      phishingDomain: phishingDomain || 'fake-2fa-lab.local',
      attackMethod: attackMethod || 'email',
      attackerId: req.user.id
    });

    res.json({
      message: 'Phishing attack initiated',
      attackId: result.attackId,
      phishingUrl: result.phishingUrl,
      status: result.status
    });

  } catch (error) {
    console.error('Phishing attack error:', error);
    res.status(500).json({ error: 'Failed to initiate phishing attack' });
  }
});

router.get('/phishing/:attackId/status', authMiddleware, async (req, res) => {
  try {
    const attack = new PhishingAttack();
    const status = await attack.getStatus(req.params.attackId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get attack status' });
  }
});

// Phishing landing page (no auth required - simulates external access)
router.get('/phishing/page/:attackId', async (req, res) => {
  try {
    const attack = new PhishingAttack();
    const page = await attack.generatePhishingPage(req.params.attackId);
    res.send(page);
  } catch (error) {
    res.status(404).send('Page not found');
  }
});

router.post('/phishing/capture/:attackId', async (req, res) => {
  try {
    const attack = new PhishingAttack();
    const result = await attack.captureCredentials(req.params.attackId, req.body);
    res.json({ message: 'Credentials captured', success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to capture credentials' });
  }
});

// MITM Attack Simulation
router.post('/mitm/initiate', authMiddleware, async (req, res) => {
  try {
    const { targetUserId, proxyPort } = req.body;
    
    const attack = new MITMAttack();
    const result = await attack.initiate({
      targetUserId: targetUserId || req.user.id,
      proxyPort: proxyPort || 8080,
      attackerId: req.user.id
    });

    res.json({
      message: 'MITM attack initiated',
      attackId: result.attackId,
      proxyPort: result.proxyPort,
      instructions: result.instructions
    });

  } catch (error) {
    console.error('MITM attack error:', error);
    res.status(500).json({ error: 'Failed to initiate MITM attack' });
  }
});

router.post('/mitm/:attackId/intercept', authMiddleware, async (req, res) => {
  try {
    const attack = new MITMAttack();
    const result = await attack.interceptTraffic(req.params.attackId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to intercept traffic' });
  }
});

// SIM Swap Attack Simulation
router.post('/sim-swap/initiate', authMiddleware, async (req, res) => {
  try {
    const { targetPhoneNumber, carrierInfo } = req.body;
    
    if (!targetPhoneNumber) {
      return res.status(400).json({ error: 'Target phone number is required' });
    }

    const attack = new SIMSwapAttack();
    const result = await attack.initiate({
      targetPhoneNumber,
      carrierInfo: carrierInfo || 'Simulated Carrier',
      attackerId: req.user.id
    });

    res.json({
      message: 'SIM swap attack initiated',
      attackId: result.attackId,
      status: result.status,
      timeline: result.timeline
    });

  } catch (error) {
    console.error('SIM swap attack error:', error);
    res.status(500).json({ error: 'Failed to initiate SIM swap attack' });
  }
});

router.post('/sim-swap/:attackId/execute', authMiddleware, async (req, res) => {
  try {
    const attack = new SIMSwapAttack();
    const result = await attack.executeSwap(req.params.attackId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute SIM swap' });
  }
});

// OTP Replay Attack Simulation
router.post('/replay/initiate', authMiddleware, async (req, res) => {
  try {
    const { targetSessionId, otpCode, captureMethod } = req.body;
    
    const attack = new ReplayAttack();
    const result = await attack.initiate({
      targetSessionId,
      otpCode,
      captureMethod: captureMethod || 'network_sniffing',
      attackerId: req.user.id
    });

    res.json({
      message: 'Replay attack initiated',
      attackId: result.attackId,
      status: result.status
    });

  } catch (error) {
    console.error('Replay attack error:', error);
    res.status(500).json({ error: 'Failed to initiate replay attack' });
  }
});

router.post('/replay/:attackId/execute', authMiddleware, async (req, res) => {
  try {
    const attack = new ReplayAttack();
    const result = await attack.executeReplay(req.params.attackId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute replay attack' });
  }
});

// Get all attack logs for dashboard
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const database = require('../models/database');
    const limit = parseInt(req.query.limit) || 20;
    
    const query = `
      SELECT 
        al.*,
        u.username as attacker_username
      FROM attack_logs al
      LEFT JOIN users u ON al.target_user_id = u.id
      ORDER BY al.created_at DESC 
      LIMIT ?
    `;

    database.getDB().all(query, [limit], (err, rows) => {
      if (err) {
        console.error('Error fetching attack logs:', err);
        return res.status(500).json({ error: 'Failed to fetch attack logs' });
      }
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attack logs' });
  }
});

// Get captured credentials from specific attack
router.get('/:attackId/captured-data', authMiddleware, async (req, res) => {
  try {
    const database = require('../models/database');
    const { attackId } = req.params;
    
    const query = `
      SELECT 
        id,
        attack_type,
        target_user_id,
        attacker_ip,
        attack_data,
        status,
        attack_details,
        success,
        captured_credentials,
        created_at
      FROM attack_logs
      WHERE id = ?
    `;

    database.getDB().get(query, [attackId], (err, row) => {
      if (err) {
        console.error('Error fetching attack data:', err);
        return res.status(500).json({ error: 'Failed to fetch attack data' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Attack not found' });
      }

      // Parse JSON data
      let attackData = {};
      let capturedCredentials = {};
      
      try {
        attackData = row.attack_data ? JSON.parse(row.attack_data) : {};
        capturedCredentials = row.captured_credentials ? JSON.parse(row.captured_credentials) : {};
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
      }

      res.json({
        attack_id: row.id,
        attack_type: row.attack_type,
        status: row.status,
        success: Boolean(row.success),
        created_at: row.created_at,
        attack_details: row.attack_details,
        attack_data: attackData,
        captured_credentials: capturedCredentials,
        has_captured_data: Object.keys(capturedCredentials).length > 0,
        summary: {
          username: capturedCredentials.username || 'N/A',
          password_captured: capturedCredentials.password ? '✓ Yes' : '✗ No',
          totp_captured: capturedCredentials.totp || capturedCredentials.otp ? '✓ Yes' : '✗ No',
          session_token: capturedCredentials.session_token ? '✓ Yes' : '✗ No',
          intercepted_requests: attackData.intercepted_requests || 0
        }
      });
    });
  } catch (error) {
    console.error('Error in captured-data endpoint:', error);
    res.status(500).json({ error: 'Failed to retrieve captured data' });
  }
});

// Test endpoint to check latest captured credentials
router.get('/test/latest-captures', authMiddleware, async (req, res) => {
  try {
    const database = require('../models/database');
    const attackType = req.query.type || 'mitm';
    
    const query = `
      SELECT 
        id,
        attack_type,
        status,
        success,
        captured_credentials,
        attack_data,
        created_at
      FROM attack_logs
      WHERE attack_type = ?
      ORDER BY created_at DESC
      LIMIT 5
    `;

    database.getDB().all(query, [attackType], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', details: err.message });
      }
      
      const results = rows.map(row => {
        let capturedCreds = {};
        let attackData = {};
        
        try {
          capturedCreds = row.captured_credentials ? JSON.parse(row.captured_credentials) : {};
          attackData = row.attack_data ? JSON.parse(row.attack_data) : {};
        } catch (e) {
          console.error('Parse error:', e);
        }
        
        return {
          attack_id: row.id,
          attack_type: row.attack_type,
          success: Boolean(row.success),
          timestamp: row.created_at,
          has_credentials: Object.keys(capturedCreds).length > 0,
          credentials: capturedCreds,
          proxy_url: attackData.proxy_url,
          intercepted_count: attackData.intercepted_requests || 0
        };
      });
      
      res.json({
        total: results.length,
        attack_type: attackType,
        attacks: results,
        summary: {
          successful_captures: results.filter(r => r.has_credentials).length,
          total_attacks: results.length
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch test data', details: error.message });
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    message: 'Attack simulation module loaded',
    available_attacks: ['phishing', 'mitm', 'sim-swap', 'replay'],
    status: 'ready'
  });
});

module.exports = router;