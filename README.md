# 🔐 2FA Cyber Attacks Lab

Educational platform demonstrating Two-Factor Authentication (2FA) vulnerabilities through simulated attack scenarios including phishing, MITM, SIM swap, and replay attacks.

> ⚠️ **EDUCATIONAL USE ONLY** - This project is for learning purposes. Never use against real systems without permission.

## Features

- 🎣 **Phishing Attack** - Fake login page simulations
- 🔄 **MITM Attack** - Session hijacking demonstrations  
- 📱 **SIM Swap Attack** - Phone number takeover scenarios
- 🔁 **Replay Attack** - Token reuse vulnerability testing
- 🛡️ **Defense Mechanisms** - WebAuthn, rate limiting, device binding
- 📊 **Real-time Dashboard** - Attack monitoring and analytics

**Tech Stack:** React 18 + TypeScript + TailwindCSS | Node.js + Express + SQLite | Docker

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop **OR** Node.js 20+
- Git

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/hassanadil18/2FA-Cyber-Attacks.git
cd 2FA-Cyber-Attacks

# Start application
docker-compose up -d

# Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# Phishing: http://localhost:9090
# MITM Proxy: http://localhost:8080
```

### Option 2: Manual Setup

```bash
# Clone repository
git clone https://github.com/hassanadil18/2FA-Cyber-Attacks.git
cd 2FA-Cyber-Attacks

# Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env and set JWT_SECRET
npm start  # Runs on http://localhost:5000

# Setup frontend (new terminal)
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

---

## 📖 Usage

1. **Register Account** - Create user at http://localhost:3000
2. **Setup 2FA** - Enable TOTP with Google Authenticator
3. **Run Attacks** - Navigate to "Attack Simulation" page
4. **Monitor Dashboard** - View attack logs and analytics
5. **Test Defenses** - Configure protection mechanisms

---

## 🧪 Attack Testing Guide

### Prerequisites for Testing
1. Start backend: `cd backend && npm start` (Port 5000)
2. Start frontend: `cd frontend && npm start` (Port 3000)
3. Open browser: http://localhost:3000

### 1. Phishing Attack Testing

**Step 1:** Launch Phishing Attack
- Navigate to "Attack Simulation" → "Phishing Attack"
- Target Email: `victim@example.com`
- Attack Type: `credential_harvest`
- Template: `fake_login_page`
- Click "Launch Attack"

**Step 2:** Test Credential Capture
- Click the phishing URL in the attack result
- Enter test credentials (any username/password/2FA)
- Check backend terminal for captured data:

```
🎯 [PHISHING SUCCESS] Attack ID: [attack-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Username: victim@example.com
🔑 Password: [captured-password]
📱 2FA Code: [captured-code]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 2. Man-in-the-Middle (MITM) Attack Testing

**Step 1:** Launch MITM Attack
- Navigate to "Attack Simulation" → "Man-in-the-Middle Attack"
- Target IP: `192.168.1.100`
- Method: `arp_spoofing`
- Interface: `eth0`
- Enable SSL Strip: ✅
- Click "Launch Attack"

**Step 2:** Test Traffic Interception
```bash
# Windows PowerShell
curl.exe "http://localhost:5000/api/dashboard/stats" --proxy "http://localhost:8080" -H "Authorization: Bearer test-token-123456"

# Linux/Mac
curl "http://localhost:5000/api/dashboard/stats" --proxy "http://localhost:8080" -H "Authorization: Bearer test-token-123456"

# Alternative test commands
curl.exe "http://localhost:5000/api/auth/me" --proxy "http://localhost:8080" -H "Authorization: Bearer test-token-456789"
curl.exe "http://localhost:5000/api/dashboard/threat-intelligence" --proxy "http://localhost:8080" -H "Authorization: Bearer intercepted-token"
```

**Expected Terminal Output:**
```
🕵️ [MITM PROXY REQUEST] Method: GET
📡 Target URL: http://localhost:5000/api/dashboard/stats
🔐 Authorization: Bearer test-token-123456
🌐 User Agent: curl/7.x.x
⏰ Timestamp: 2025-xx-xxT12:xx:xx.xxxZ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 [MITM SUCCESS] Authentication token captured!
```

**Troubleshooting MITM:**
- Ensure MITM attack is launched first from frontend
- Proxy runs on port 8080 (check if attack shows "Proxy URL: http://localhost:8080")
- If connection fails, restart backend and launch fresh MITM attack

### 3. SIM Swap Attack Testing

**Step 1:** Launch SIM Swap Attack
- Navigate to "Attack Simulation" → "SIM Swap Attack"
- Phone Number: `+1234567890`
- Carrier: `Verizon`
- Target Service: `Banking 2FA`
- Click "Launch Attack"

**Step 2:** Verify Attack Execution
- Wait 5-10 seconds for attack simulation
- Check backend terminal for results:

```
📱 [SIM SWAP SUCCESS] Attack ID: [attack-id]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 Phone Number: ✅ HIJACKED
🆔 New SIM ID: [new-sim-id]
📱 Control Status: ✅ ATTACKER CONTROLLED
🔐 SMS Interception: ✅ ACTIVE
💥 Impact: ALL SMS 2FA COMPROMISED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Replay Attack Testing

**Step 1:** Launch Replay Attack
- Navigate to "Attack Simulation" → "Replay Attack"
- Token: `test-token-123456`
- Target Endpoint: `/api/dashboard/stats`
- Method: `GET`
- Click "Launch Attack"

**Step 2:** Verify Token Replay
- Check terminal for replay attempt logs
- Monitor for successful/failed replays

### 5. Defense Testing

**Test WebAuthn Defense:**
- Navigate to "Defense Center" → "WebAuthn Defense"
- Click "Enable WebAuthn"
- Try authenticating with biometrics/security key

**Test Rate Limiting:**
- Make multiple rapid API requests
- Observe rate limiting activation

**Test Device Binding:**
- Login from different browsers/devices
- Verify device binding prompts

---

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000
```

### Docker Commands

```bash
# Build containers
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

---

## 📂 Project Structure

```
2FA-Cyber-Attacks/
├── backend/
│   ├── src/
│   │   ├── attacks/          # Attack implementations
│   │   ├── defenses/         # Defense mechanisms
│   │   ├── routes/           # API endpoints
│   │   ├── models/           # Database models
│   │   └── server.js         # Express server
│   ├── data/                 # SQLite database
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── components/       # UI components
│   │   ├── contexts/         # Auth context
│   │   └── services/         # API services
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## 🔒 Security Notes

- SQLite database stores simulated data locally
- JWT tokens expire in 24 hours
- Rate limiting prevents brute force attempts
- All attacks are isolated and simulated
- No real credentials or systems are compromised

---

## 🐛 Troubleshooting

**Port conflicts:**
```bash
# Check if ports are in use
netstat -ano | findstr ":3000"
netstat -ano | findstr ":5000"
```

**Docker issues:**
```bash
# Reset Docker environment
docker-compose down -v
docker-compose up -d --build
```

**Database errors:**
```bash
# Recreate database
cd backend
node create-database.js
```

---

## 📝 License

MIT License - Educational use only

---

**Built for cybersecurity education and awareness**