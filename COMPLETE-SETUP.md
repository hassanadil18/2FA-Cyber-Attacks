# 🎯 COMPLETE PROJECT SETUP - NVM + NPM + DOCKER

## ✅ SETUP COMPLETED

Your 2FA Attacks Lab now has:
1. ✅ Node.js 20.11.0 installed via NVM
2. ✅ npm 10.2.4 available
3. ✅ Complete Docker configuration
4. ✅ Production & Development Docker setups
5. ✅ PowerShell automation scripts
6. ✅ Comprehensive documentation

---

## 📦 Project Structure

```
2FA-Cyber-Attacks-Lab/
├── 📁 backend/
│   ├── Dockerfile              ← Production backend image
│   ├── Dockerfile.dev          ← Development backend image
│   ├── .dockerignore           ← Exclude files from Docker
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── attacks/
│   │   └── models/
│   └── data/
│       └── attacks.db
├── 📁 frontend/
│   ├── Dockerfile              ← Production frontend image
│   ├── Dockerfile.dev          ← Development frontend image
│   ├── .dockerignore
│   ├── nginx.conf              ← Nginx configuration
│   ├── package.json
│   └── src/
│       └── pages/
├── docker-compose.yml          ← Production deployment
├── docker-compose.dev.yml      ← Development with hot reload
├── 📜 docker-build.ps1         ← Build & start script
├── 📜 docker-start.ps1         ← Quick start script
├── 📜 docker-stop.ps1          ← Stop services script
├── 📜 docker-logs.ps1          ← View logs script
├── 📘 DOCKER-GUIDE.md          ← Complete Docker documentation
├── 📘 SETUP-GUIDE.md           ← NVM, NPM, Docker setup
├── 📘 COMPLETE-ATTACK-EXPLANATION.md
└── 📘 REACT-PRESENTATION-GUIDE.md
```

---

## 🚀 THREE WAYS TO RUN YOUR PROJECT

### Method 1: Docker (Recommended for Presentation) 🐳

**Advantages:**
- ✅ Professional deployment
- ✅ Isolated environment
- ✅ Consistent across machines
- ✅ Production-ready
- ✅ Easy to demo

**Quick Start:**
```powershell
# Navigate to project
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# First time - Build and start (5-10 minutes)
.\docker-build.ps1

# Subsequent times - Just start (30 seconds)
.\docker-start.ps1

# View logs
.\docker-logs.ps1

# Stop
.\docker-stop.ps1
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

### Method 2: Manual with NVM (Development) 💻

**Advantages:**
- ✅ Faster iteration
- ✅ Easier debugging
- ✅ Direct file access
- ✅ Real-time changes

**Setup:**
```powershell
# Activate Node.js (if needed)
$env:Path = "C:\Users\Hassan Adil\AppData\Local\nvm\v20.11.0;" + $env:Path

# Terminal 1 - Backend
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab\backend"
npm install
npm start

# Terminal 2 - Frontend
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab\frontend"
npm install
npm run dev
```

**Access:**
- Frontend: http://localhost:3000 (Vite dev server)
- Backend: http://localhost:5000 (Express)

---

### Method 3: Docker Development Mode (Hot Reload) 🔥

**Advantages:**
- ✅ Docker isolation
- ✅ Hot reload enabled
- ✅ Code changes reflected instantly
- ✅ Debug port available

**Setup:**
```powershell
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# Start development containers
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

**Access:**
- Frontend: http://localhost:3000 (with hot reload)
- Backend: http://localhost:5000 (with nodemon)
- Debug port: 9229 (for debugging)

---

## 🎓 PRESENTATION SETUP (RECOMMENDED)

### Option A: Docker (Most Professional) ⭐

```powershell
# 1. Start Docker Desktop
# (Wait for whale icon to be stable)

# 2. Navigate to project
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# 3. Build and start (first time)
.\docker-build.ps1

# 4. Verify services running
docker-compose ps
# Should show: backend (healthy), frontend (healthy)

# 5. Open browser
start http://localhost:3000

# 6. Add test data
docker-compose exec backend node single-attack.js 1
docker-compose exec backend node single-attack.js 2
docker-compose exec backend node single-attack.js 3

# 7. Verify evidence
docker-compose exec backend node show-evidence.js

# 8. You're ready to present! 🎉
```

### Option B: Manual Setup (Backup Plan)

```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Evidence
cd backend
node show-evidence.js
```

---

## 🔧 DOCKER COMMANDS REFERENCE

### Basic Operations
```powershell
# Check Docker status
docker ps

# Build images
docker-compose build

# Start services (background)
docker-compose up -d

# Start services (foreground with logs)
docker-compose up

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### View Logs
```powershell
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 -f
```

### Execute Commands in Containers
```powershell
# Show evidence
docker-compose exec backend node show-evidence.js

# Add test attack
docker-compose exec backend node single-attack.js 1

# Clean database
docker-compose exec backend node clean-database.js

# Enter backend shell
docker-compose exec backend sh

# Enter frontend shell
docker-compose exec frontend sh
```

### Service Management
```powershell
# Check service status
docker-compose ps

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Rebuild and restart
docker-compose up -d --build

# View resource usage
docker stats
```

### Troubleshooting
```powershell
# Remove all containers and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check logs for errors
docker-compose logs backend | Select-String -Pattern "error"
docker-compose logs frontend | Select-String -Pattern "error"

# Verify network
docker network ls
docker network inspect 2fa-attacks-network
```

---

## 🧪 TESTING YOUR SETUP

### Quick Health Check

```powershell
# Using Docker
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# 1. Check services running
docker-compose ps

# 2. Test backend health
Invoke-WebRequest http://localhost:5000/api/health

# 3. Test frontend accessible
Invoke-WebRequest http://localhost:3000

# 4. Add test attack
docker-compose exec backend node single-attack.js 1

# 5. View evidence
docker-compose exec backend node show-evidence.js

# All working? ✅ You're ready!
```

### Full Integration Test

```powershell
# 1. Start fresh
docker-compose down -v
docker-compose up -d

# 2. Wait for services
Start-Sleep -Seconds 15

# 3. Execute all attack types
docker-compose exec backend node single-attack.js 1  # Phishing
docker-compose exec backend node single-attack.js 2  # MITM
docker-compose exec backend node single-attack.js 3  # SIM Swap

# 4. Verify all captured
docker-compose exec backend node show-evidence.js

# Should show:
# - 1 Phishing attack
# - 1 MITM attack
# - 1 SIM Swap attack
```

---

## 📊 WHAT YOU CAN SHOW IN PRESENTATION

### 1. Professional Docker Deployment
```powershell
docker-compose ps
```
Shows containerized services running

### 2. Live Attack Execution
- Open http://localhost:3000
- Execute phishing attack
- Show phishing URL in browser
- Enter credentials on fake page

### 3. Evidence Collection
```powershell
docker-compose exec backend node show-evidence.js
```
Shows captured credentials in real-time

### 4. Database Persistence
```powershell
# Stop services
docker-compose down

# Start again
docker-compose up -d

# Data still there!
docker-compose exec backend node show-evidence.js
```

### 5. Scalability & Architecture
Show `docker-compose.yml`:
- Frontend (Nginx + React)
- Backend (Node.js + Express)
- Network isolation
- Health checks
- Volume persistence

---

## 🆘 TROUBLESHOOTING GUIDE

### Node.js Not Found
```powershell
# Solution 1: Activate NVM version
nvm use 20.11.0

# Solution 2: Add to PATH manually
$env:Path = "C:\Users\Hassan Adil\AppData\Local\nvm\v20.11.0;" + $env:Path

# Solution 3: Use full path
C:\Users\Hassan` Adil\AppData\Local\nvm\v20.11.0\node.exe --version
```

### Docker Port Conflicts
```powershell
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

### Docker Build Fails
```powershell
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

### Container Won't Start
```powershell
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check Docker resources
# Docker Desktop → Settings → Resources
# Increase Memory to 4GB+
```

---

## 📚 DOCUMENTATION INDEX

All guides in your project:

1. **SETUP-GUIDE.md** ← You are here
   - Complete NVM, NPM, Docker setup
   - Three ways to run project
   - Troubleshooting

2. **DOCKER-GUIDE.md**
   - Comprehensive Docker documentation
   - Advanced commands
   - CI/CD integration
   - Security best practices

3. **COMPLETE-ATTACK-EXPLANATION.md**
   - How attacks work technically
   - Data flow diagrams
   - Database storage explained
   - Testing methodology

4. **REACT-PRESENTATION-GUIDE.md**
   - Step-by-step presentation script
   - UI walkthrough
   - Demo sequence

---

## ✅ FINAL CHECKLIST

Before your presentation:

**NVM & Node.js:**
- [ ] `node --version` shows v20.11.0
- [ ] `npm --version` shows 10.2.4
- [ ] Can run `npm install` successfully

**Docker:**
- [ ] Docker Desktop running
- [ ] `docker --version` works
- [ ] `docker-compose ps` shows services
- [ ] Both services show "healthy" status

**Application:**
- [ ] http://localhost:3000 accessible
- [ ] http://localhost:5000/api/health returns 200
- [ ] Can execute attacks from UI
- [ ] `docker-compose exec backend node show-evidence.js` shows data

**Presentation Materials:**
- [ ] Read COMPLETE-ATTACK-EXPLANATION.md
- [ ] Review REACT-PRESENTATION-GUIDE.md
- [ ] Test demo sequence
- [ ] Prepare answers for questions

---

## 🎬 DEMO SEQUENCE FOR CLASS

```powershell
# 1. Show Docker running
docker-compose ps

# 2. Open frontend
start http://localhost:3000

# 3. Execute phishing attack
# (Use UI - fill form and click Execute)

# 4. Show phishing page
# (Open phishing URL from response)

# 5. Enter credentials on fake page
# Username: victim@bank.com
# Password: test123
# 2FA: 456789

# 6. Show captured evidence
docker-compose exec backend node show-evidence.js

# 7. Repeat for MITM and SIM Swap attacks

# 8. Final evidence display
docker-compose exec backend node show-evidence.js
```

---

## 🚀 YOU'RE ALL SET!

**What You Have:**
✅ Professional Docker deployment
✅ Working Node.js via NVM
✅ Complete attack simulation system
✅ Evidence collection tools
✅ Automated scripts
✅ Comprehensive documentation

**What You Can Do:**
✅ Run with Docker (production-like)
✅ Run manually (development)
✅ Execute real attacks
✅ Show evidence
✅ Present professionally

**Next Steps:**
1. Run `.\docker-build.ps1` to start everything
2. Test all three attack types
3. Review COMPLETE-ATTACK-EXPLANATION.md
4. Practice presentation sequence
5. You're ready! 🎉

---

**Questions? Check:**
- DOCKER-GUIDE.md for Docker details
- COMPLETE-ATTACK-EXPLANATION.md for attack mechanics
- REACT-PRESENTATION-GUIDE.md for presentation flow

**Good luck with your presentation! You've got this! 💪**
