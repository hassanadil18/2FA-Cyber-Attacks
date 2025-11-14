# 2FA Cyber Attacks Simulation Lab

A comprehensive educational platform for demonstrating and understanding Two-Factor Authentication (2FA) vulnerabilities, attack methods, and defense mechanisms. This project is designed for cybersecurity education, research, and awareness purposes.

## 🚨 IMPORTANT DISCLAIMER

**This software is for educational purposes only.** All attack simulations are controlled, ethical demonstrations designed to help security professionals and students understand 2FA vulnerabilities. The attacks are:

- ✅ **Simulated** - No real attacks are performed
- ✅ **Controlled** - All data stays within the lab environment
- ✅ **Educational** - Designed for learning and awareness
- ❌ **Not for malicious use** - Unauthorized use is prohibited

## 🎯 Project Overview

### Key Features

#### 🔐 2FA Implementation
- **TOTP (Time-based OTP)** - Google Authenticator compatible
- **SMS OTP** - Simulated SMS delivery system
- **Email OTP** - Local SMTP simulation
- **Push Notifications** - Simulated push authentication
- **Backup Codes** - Recovery code generation and validation

#### ⚔️ Attack Simulations
- **Phishing Attacks** - Credential harvesting simulation
- **Man-in-the-Middle (MITM)** - Session hijacking demonstration
- **SIM Swapping** - Mobile number takeover simulation
- **OTP Replay Attacks** - Token reuse vulnerability testing
- **Social Engineering** - Human factor attack scenarios

#### 🛡️ Defense Mechanisms
- **WebAuthn Implementation** - Hardware key simulation
- **Device Binding** - Trust-based device recognition
- **Rate Limiting** - Brute force protection
- **Alert System** - Real-time threat notifications
- **Anomaly Detection** - Suspicious behavior identification

#### 📊 Monitoring & Analytics
- **Real-time Dashboard** - Live security monitoring
- **Attack Analytics** - Detailed attack pattern analysis
- **Defense Effectiveness** - Protection metric tracking
- **Threat Intelligence** - Risk assessment and reporting
- **Audit Logging** - Comprehensive security event logging

## 🏗️ Technical Architecture

### Backend Stack
- **Node.js & Express** - RESTful API server
- **SQLite Database** - Local data storage
- **JWT Authentication** - Stateless session management
- **bcryptjs** - Password hashing and security
- **speakeasy** - TOTP implementation
- **nodemailer** - Email OTP delivery
- **QRCode** - 2FA setup QR generation

### Frontend Stack
- **React 18** - Modern component-based UI
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **React Router** - Client-side routing
- **Lucide Icons** - Comprehensive icon library
- **Context API** - State management

### Security Features
- **Helmet.js** - Security header protection
- **CORS** - Cross-origin request security
- **Rate Limiting** - API abuse prevention
- **Input Validation** - XSS and injection protection
- **Secure Headers** - Content security policies

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/2FA-Cyber-Attacks-Lab.git
   cd 2FA-Cyber-Attacks-Lab
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Backend will run on `http://localhost:3001`

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will run on `http://localhost:3000`

4. **Access the Application**
   - Open your browser to `http://localhost:3000`
   - Register a new account
   - Explore the 2FA setup and attack simulations

## 📚 Detailed Usage Guide

### Getting Started

1. **User Registration**
   - Create an account with username, email, and strong password
   - The system enforces password complexity requirements

2. **2FA Setup**
   - Navigate to the 2FA Setup page
   - Choose from TOTP, SMS, Email, or Push notifications
   - For TOTP: Scan QR code with Google Authenticator
   - Test your 2FA method to ensure it's working

3. **Attack Simulations**
   - Go to the Attack Center
   - Select an attack type to simulate
   - Follow the guided simulation process
   - Observe how defenses react to attacks

4. **Defense Configuration**
   - Visit the Defense Center
   - Configure rate limiting thresholds
   - Set up device binding policies
   - Enable WebAuthn for stronger security

5. **Monitoring**
   - Access the Security Dashboard
   - View real-time attack attempts
   - Analyze defense effectiveness
   - Export security logs for analysis

### Attack Simulation Details

#### Phishing Attack Simulation
```javascript
// Example: Simulating a phishing attempt
{
  "targetEmail": "user@example.com",
  "phishingDomain": "fake-bank.com",
  "attackVector": "email",
  "socialEngineering": true
}
```

#### MITM Attack Simulation
```javascript
// Example: Session hijacking simulation
{
  "targetSession": "user123",
  "interceptedTokens": ["otp_token"],
  "networkPosition": "wifi_hotspot"
}
```

#### SIM Swap Simulation
```javascript
// Example: Mobile number takeover
{
  "targetPhone": "+1234567890",
  "socialEngineeringVector": "customer_service",
  "timeline": "24_hours"
}
```

### Defense Mechanism Configuration

#### Rate Limiting Setup
```javascript
{
  "loginAttempts": {
    "window": "15m",
    "maxAttempts": 5
  },
  "otpRequests": {
    "window": "5m", 
    "maxAttempts": 3
  }
}
```

#### Device Binding Configuration
```javascript
{
  "trustThreshold": 3,
  "fingerprintComponents": [
    "userAgent",
    "screen",
    "timezone",
    "language",
    "plugins"
  ]
}
```

## 🔧 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "otpCode": "string" // Required if 2FA enabled
}
```

### 2FA Endpoints

#### Setup TOTP
```http
POST /api/2fa/totp/setup
Authorization: Bearer <token>
```

#### Verify TOTP
```http
POST /api/2fa/totp/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "123456"
}
```

### Attack Simulation Endpoints

#### Simulate Phishing Attack
```http
POST /api/attacks/phishing/simulate
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetEmail": "victim@example.com",
  "phishingDomain": "fake-site.com"
}
```

#### Simulate MITM Attack
```http
POST /api/attacks/mitm/simulate
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": "session123",
  "interceptMethod": "wifi_hotspot"
}
```

### Defense Endpoints

#### Configure Rate Limiting
```http
POST /api/defenses/rate-limiting/configure
Authorization: Bearer <token>
Content-Type: application/json

{
  "actionType": "login_attempts",
  "maxAttempts": 5,
  "windowMs": 900000
}
```

#### Register WebAuthn Device
```http
POST /api/defenses/webauthn/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceName": "YubiKey 5",
  "publicKey": "...",
  "credentialId": "..."
}
```

### Dashboard Endpoints

#### Get Security Statistics
```http
GET /api/dashboard/stats
Authorization: Bearer <token>
```

#### Get Attack Analytics
```http
GET /api/dashboard/analytics/attacks?timeframe=24h
Authorization: Bearer <token>
```

#### Export Security Logs
```http
GET /api/dashboard/export/logs?type=all&format=json&days=7
Authorization: Bearer <token>
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_2fa_enabled BOOLEAN DEFAULT 0,
  totp_secret TEXT,
  phone_number TEXT,
  backup_codes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);
```

### Attack Logs Table
```sql
CREATE TABLE attack_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  attack_id TEXT UNIQUE NOT NULL,
  attack_type TEXT NOT NULL,
  target_user_id INTEGER,
  attack_details TEXT,
  success BOOLEAN DEFAULT 0,
  defense_triggered BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (target_user_id) REFERENCES users (id)
);
```

### Defense Logs Table
```sql
CREATE TABLE defense_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  defense_type TEXT NOT NULL,
  user_id INTEGER,
  triggered_by TEXT,
  action_taken TEXT,
  effectiveness TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🧪 Testing & Development

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests  
cd frontend
npm test
```

### Development Mode
```bash
# Start backend in development mode
cd backend
npm run dev

# Start frontend in development mode
cd frontend
npm start
```

### Environment Variables
Create `.env` files in both backend and frontend directories:

**Backend `.env`:**
```env
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
PORT=3001
```

**Frontend `.env`:**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ENV=development
```

## 🔒 Security Considerations

### Educational Environment Security
- All attacks are simulated and contained
- No real user data is compromised
- Database is local SQLite (no cloud exposure)
- JWT tokens have short expiration times
- Rate limiting prevents abuse

### Production Deployment (If Needed)
- Use environment variables for all secrets
- Implement proper SSL/TLS certificates
- Use production-grade database (PostgreSQL)
- Enable comprehensive logging
- Implement backup and recovery procedures

## 📈 Monitoring & Analytics

### Key Metrics Tracked
- **Authentication Success Rate** - Login success vs failures
- **2FA Adoption Rate** - Users with 2FA enabled
- **Attack Detection Rate** - Successful vs blocked attacks
- **Defense Effectiveness** - Protection success percentage
- **User Behavior Patterns** - Login times, locations, devices

### Dashboard Features
- **Real-time Activity Feed** - Live security events
- **Threat Level Indicators** - Current security posture
- **Attack Pattern Analysis** - Trending attack methods
- **Geographic Data** - Location-based attack attempts
- **Time-series Charts** - Historical security data

## 🤝 Contributing

We welcome contributions to improve the educational value and security demonstrations of this project.

### Contributing Guidelines
1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Code of Conduct
- Use this project only for educational purposes
- Do not adapt it for malicious activities
- Report security vulnerabilities responsibly
- Respect the educational nature of the platform

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🙏 Acknowledgments

- **OWASP** - For security best practices and guidelines
- **Node.js Community** - For excellent backend tools and libraries
- **React Team** - For the powerful frontend framework
- **Security Researchers** - For documenting 2FA vulnerabilities
- **Educational Institutions** - For promoting cybersecurity awareness

## 📞 Support & Contact

For questions, suggestions, or support:

- **GitHub Issues** - Report bugs or request features
- **Educational Use** - Contact for classroom implementation
- **Security Questions** - Reach out for clarification on implementations

---

**Remember: This is an educational tool. Use responsibly and ethically.**