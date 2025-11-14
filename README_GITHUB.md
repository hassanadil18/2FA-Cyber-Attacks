# 🔐 2FA Cyber Attacks Lab - Educational Security Project

A comprehensive educational platform demonstrating common 2FA (Two-Factor Authentication) attack vectors and defense mechanisms. This project simulates real-world attack scenarios including phishing, MITM (Man-in-the-Middle), SIM swap, and replay attacks in a controlled environment.

> ⚠️ **DISCLAIMER**: This project is for educational purposes only. Never use these techniques against real systems without explicit permission. Unauthorized access is illegal.

---

## 🎯 Features

### Attack Simulations
- 🎣 **Phishing Attacks**: Realistic fake login pages to capture credentials and 2FA codes
- 🔄 **MITM (Man-in-the-Middle)**: HTTP/HTTPS traffic interception and session hijacking
- 📱 **SIM Swap Attacks**: Simulated carrier social engineering and phone number hijacking
- 🔁 **Replay Attacks**: Token and OTP replay demonstrations

### Defense Mechanisms
- 🛡️ FIDO2/WebAuthn implementation
- 🔑 Hardware security key support
- 📲 Secure 2FA setup guides
- 🔐 Best practices documentation

### Technical Stack
- **Frontend**: React 18 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + SQLite
- **Deployment**: Docker + Docker Compose
- **Security**: JWT authentication, Helmet.js, rate limiting

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac/Linux)
- Node.js 20+ (for local development)
- Git

### Option 1: Docker (Recommended)
```bash
# Clone the repository
git clone <your-repo-url>
cd 2FA-Cyber-Attacks-Lab

# Start with Docker
docker-compose up -d

# Open in browser
http://localhost:3000
```

### Option 2: Manual Setup
```bash
# Backend
cd backend
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm start
```

---

## 📦 Project Structure

```
2FA-Cyber-Attacks-Lab/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── server.js       # Main server
│   │   ├── routes/         # API routes
│   │   ├── attacks/        # Attack implementations
│   │   ├── models/         # Database models
│   │   └── middleware/     # Auth & security
│   ├── data/               # SQLite database
│   ├── Dockerfile          # Backend container
│   └── package.json
├── frontend/               # React TypeScript app
│   ├── src/
│   │   ├── pages/          # React pages
│   │   ├── components/     # Reusable components
│   │   ├── services/       # API services
│   │   └── contexts/       # React contexts
│   ├── Dockerfile          # Frontend container
│   ├── nginx.conf          # Nginx configuration
│   └── package.json
├── docker-compose.yml      # Docker orchestration
├── DOCKER-GUIDE.md         # Docker documentation
├── SETUP-GUIDE.md          # Setup instructions
└── README.md               # This file
```

---

## 🎓 Usage Guide

### 1. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### 2. Execute Attack Simulations

#### Phishing Attack
1. Navigate to "Attack Simulation" tab
2. Fill in target email and attack parameters
3. Click "Execute Phishing Attack"
4. Access the generated phishing URL to see the fake login page
5. Submit credentials to test capture mechanism

#### MITM Attack
1. Go to "MITM Attack" tab
2. Configure proxy settings (port 8080)
3. Execute attack to start proxy server
4. Route traffic through proxy to intercept data

#### SIM Swap Attack
1. Navigate to "SIM Swap" tab
2. Enter target phone and carrier information
3. Execute to simulate carrier social engineering
4. View captured 2FA codes

### 3. View Evidence
```bash
# Using Docker
docker-compose exec backend node show-evidence.js

# Or from backend directory
node show-evidence.js
```

---

## 🐳 Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart
```

### Development
```bash
# Rebuild containers
docker-compose build --no-cache

# View running containers
docker-compose ps

# Execute commands in backend
docker-compose exec backend node show-evidence.js
```

---

## 🔧 Configuration

### Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
DATABASE_PATH=./data/attacks.db
```

**Frontend**:
The frontend uses `REACT_APP_API_URL` which defaults to `http://localhost:5000/api`

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Attack Simulation
- `POST /api/attacks/phishing` - Execute phishing attack
- `POST /api/attacks/mitm` - Execute MITM attack
- `POST /api/attacks/sim-swap` - Execute SIM swap attack
- `POST /api/attacks/replay` - Execute replay attack

### Evidence
- `GET /api/evidence/phishing` - Get phishing evidence
- `GET /api/evidence/mitm` - Get MITM evidence
- `GET /api/evidence/sim-swap` - Get SIM swap evidence

---

## 🧪 Testing

### Add Test Data
```bash
# Phishing attack
docker-compose exec backend node single-attack.js 1

# MITM attack
docker-compose exec backend node single-attack.js 2

# SIM Swap attack
docker-compose exec backend node single-attack.js 3
```

### View Test Evidence
```bash
docker-compose exec backend node show-evidence.js
```

### Clean Database
```bash
docker-compose exec backend node clean-database.js
```

---

## 🛡️ Security Features

### Backend Security
- ✅ JWT-based authentication
- ✅ Helmet.js security headers
- ✅ Rate limiting on API endpoints
- ✅ CORS configuration
- ✅ Input validation and sanitization
- ✅ SQL injection prevention

### Docker Security
- ✅ Non-root user in containers
- ✅ Minimal base images (Alpine)
- ✅ Health checks for containers
- ✅ Network isolation
- ✅ Volume permissions

---

## 📚 Documentation

Comprehensive guides are available:

- **[SETUP-GUIDE.md](SETUP-GUIDE.md)** - Complete setup instructions
- **[DOCKER-GUIDE.md](DOCKER-GUIDE.md)** - Docker deployment guide
- **[DOCKER-ATTACK-TESTING.md](DOCKER-ATTACK-TESTING.md)** - Attack testing guide
- **[COMPLETE-ATTACK-EXPLANATION.md](COMPLETE-ATTACK-EXPLANATION.md)** - Technical attack details
- **[REACT-PRESENTATION-GUIDE.md](REACT-PRESENTATION-GUIDE.md)** - Presentation walkthrough
- **[NODE-MODULES-GUIDE.md](NODE-MODULES-GUIDE.md)** - Dependency management

---

## 🎯 Learning Objectives

This project demonstrates:

1. **Attack Vectors**: Understanding common 2FA bypass techniques
2. **Defense Mechanisms**: Implementing proper security controls
3. **Full-Stack Development**: React + Node.js + Docker
4. **Security Best Practices**: Authentication, authorization, data protection
5. **Docker Deployment**: Containerization and orchestration

---

## 🚨 Ethical Considerations

### Educational Use Only
- This project simulates attacks in a controlled environment
- Never use against systems you don't own or have permission to test
- Unauthorized access is illegal and unethical
- Use for learning, research, and authorized security testing only

### Responsible Disclosure
If you discover vulnerabilities:
- Report to affected parties responsibly
- Follow coordinated disclosure practices
- Never exploit vulnerabilities maliciously

---

## 🔍 Troubleshooting

### Docker Issues
**Problem**: Containers won't start
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port Conflicts
**Problem**: Port already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change ports in docker-compose.yml
```

### Attack Ports Not Accessible
**Problem**: Phishing/MITM ports not working
```bash
# Verify ports are exposed
docker-compose ps
docker port 2fa-attacks-backend

# Ports should show: 5000, 8080, 9090-9092
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is for educational purposes. Use responsibly.

---

## 👥 Authors

- **Your Name** - *Initial work* - [GitHub Profile](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- Built for Information Security course project
- Demonstrates real-world attack vectors in controlled environment
- Thanks to the cybersecurity community for research and documentation

---

## 📞 Support

For questions or issues:
- Open an issue on GitHub
- Check documentation in `/docs` folder
- Review troubleshooting guides

---

## 🎓 Educational Resources

Learn more about 2FA security:
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
- [FIDO Alliance](https://fidoalliance.org/)

---

**⚠️ Remember: Use this knowledge ethically and legally. Unauthorized access is a crime.**

---

Made with ❤️ for cybersecurity education
