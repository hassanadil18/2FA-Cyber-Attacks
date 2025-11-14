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