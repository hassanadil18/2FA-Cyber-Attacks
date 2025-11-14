# 🚀 Complete Setup Guide - 2FA Attacks Lab

## Table of Contents
1. [NVM & Node.js Setup](#nvm--nodejs-setup)
2. [Docker Setup](#docker-setup)
3. [Manual Setup (Without Docker)](#manual-setup-without-docker)
4. [Quick Start Commands](#quick-start-commands)
5. [Troubleshooting](#troubleshooting)

---

## 1. NVM & Node.js Setup

### Install NVM (Node Version Manager)

#### Windows:
1. Download nvm-windows from: https://github.com/coreybutler/nvm-windows/releases
2. Run the installer
3. Verify installation:
```powershell
nvm version
```

### Install Node.js Using NVM

```powershell
# List available Node.js versions
nvm list available

# Install Node.js 20 LTS (recommended)
nvm install 20.11.0

# Use the installed version
nvm use 20.11.0

# Verify installation
node --version
npm --version
```

### Fix NVM Path Issues (Windows)

If you see "activation error" with spaces in username:

**Option 1: Manual PATH (Temporary for current session)**
```powershell
$env:Path = "C:\Users\YOUR_USERNAME\AppData\Local\nvm\v20.11.0;" + $env:Path
node --version
```

**Option 2: Use Direct Node Path**
```powershell
# Navigate to project
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# Use full path to node
C:\Users\YOUR_USERNAME\AppData\Local\nvm\v20.11.0\node.exe --version
```

**Option 3: Add to System PATH (Permanent)**
1. Open System Properties → Environment Variables
2. Edit PATH variable
3. Add: `C:\Users\YOUR_USERNAME\AppData\Local\nvm\v20.11.0`
4. Restart terminal

---

## 2. Docker Setup

### ✅ Prerequisites
- Docker Desktop installed and running
- Docker version 20.10+ recommended

### Check Docker Installation
```powershell
docker --version
docker-compose --version
```

### Quick Docker Setup

#### Option A: Using PowerShell Scripts (Easiest)

```powershell
# Navigate to project
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# Build and start (first time - takes 5-10 minutes)
.\docker-build.ps1

# Start services (subsequent times)
.\docker-start.ps1

# View logs
.\docker-logs.ps1

# Stop services
.\docker-stop.ps1
```

#### Option B: Using Docker Compose Commands

```powershell
# Navigate to project
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"

# Build images
docker-compose build

# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop services
docker-compose down
```

### Access Application (Docker)
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Docker Commands Cheat Sheet

```powershell
# View running containers
docker ps

# Execute command in backend container
docker-compose exec backend node show-evidence.js
docker-compose exec backend node single-attack.js 1
docker-compose exec backend node clean-database.js

# View backend logs only
docker-compose logs -f backend

# View frontend logs only
docker-compose logs -f frontend

# Restart specific service
docker-compose restart backend
docker-compose restart frontend

# Rebuild and restart
docker-compose up -d --build

# Stop and remove everything (including volumes)
docker-compose down -v

# Check container resource usage
docker stats
```

---

## 3. Manual Setup (Without Docker)

### Backend Setup

```powershell
# Navigate to backend
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab\backend"

# Install dependencies
npm install

# Start server
npm start

# Or for development (with auto-reload)
npm run dev
```

Backend will run on: http://localhost:5000

### Frontend Setup

```powershell
# Open NEW terminal
# Navigate to frontend
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab\frontend"

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: http://localhost:3000

---

## 4. Quick Start Commands

### For Presentation (Recommended: Docker)

```powershell
# 1. Start Docker Desktop

# 2. Build and run
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
.\docker-build.ps1

# 3. Open browser
# http://localhost:3000

# 4. Add test data
docker-compose exec backend node single-attack.js 1
docker-compose exec backend node single-attack.js 2
docker-compose exec backend node single-attack.js 3

# 5. View evidence
docker-compose exec backend node show-evidence.js

# 6. When done
.\docker-stop.ps1
```

### For Development (Manual)

```powershell
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# Terminal 3 - Testing
cd backend
node show-evidence.js
```

---

## 5. Troubleshooting

### NVM Issues

**Problem**: `nvm use` fails with path error
```
Solution 1: Use full path
$env:Path = "C:\Users\Hassan Adil\AppData\Local\nvm\v20.11.0;" + $env:Path

Solution 2: Check installed versions
nvm list

Solution 3: Reinstall specific version
nvm install 20.11.0
```

**Problem**: `node` command not found
```
Solution: Check NVM installation
nvm version
nvm list

If nvm works but node doesn't, add to PATH manually
```

### Docker Issues

**Problem**: Docker daemon not running
```
Solution: Start Docker Desktop application
Wait for whale icon to be stable (not animating)
```

**Problem**: Port already in use (3000 or 5000)
```
Solution 1: Stop conflicting process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

Solution 2: Change ports in docker-compose.yml
ports:
  - "3001:3000"  # Use 3001 instead
  - "5001:5000"  # Use 5001 instead
```

**Problem**: Container won't start
```
Solution: Check logs
docker-compose logs backend
docker-compose logs frontend

Rebuild from scratch:
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

**Problem**: Cannot connect to backend from frontend
```
Solution: Verify network
docker network ls
docker network inspect 2fa-attacks-network

Check if both containers are in same network:
docker-compose ps
```

### Database Issues

**Problem**: No evidence showing
```
Solution: Add test data
docker-compose exec backend node single-attack.js 1

Or run attacks from UI:
http://localhost:3000
```

**Problem**: Database locked
```
Solution: Restart backend
docker-compose restart backend

Or stop all and start fresh:
docker-compose down
docker-compose up -d
```

### Build Issues

**Problem**: npm install fails
```
Solution: Clear cache
npm cache clean --force
rm -rf node_modules
npm install
```

**Problem**: Docker build fails
```
Solution: Check Docker resources
Docker Desktop → Settings → Resources
Increase Memory to 4GB+
Increase CPU to 2+

Clear Docker cache:
docker system prune -a
```

---

## 📊 Comparison: Docker vs Manual

| Feature | Docker | Manual Setup |
|---------|--------|--------------|
| Setup Time | 10 minutes (first time) | 5 minutes |
| Start Time | 30 seconds | 1-2 minutes |
| Isolation | ✅ Complete | ❌ Shared system |
| Port Conflicts | ✅ Isolated | ⚠️ Possible |
| Consistency | ✅ Same on all machines | ⚠️ Depends on system |
| For Presentation | ✅ Recommended | ✅ Works |
| Development | ✅ Hot reload available | ✅ Easier debugging |

---

## 🎯 Recommended Setup

### For Presentation Tomorrow:
**Use Docker** - More reliable, professional, isolated environment

```powershell
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
.\docker-build.ps1
```

### For Development:
**Use Manual Setup** - Faster iteration, easier debugging

```powershell
# Backend: npm start
# Frontend: npm run dev
```

---

## 📚 Additional Resources

- **DOCKER-GUIDE.md** - Complete Docker documentation
- **COMPLETE-ATTACK-EXPLANATION.md** - How attacks work
- **REACT-PRESENTATION-GUIDE.md** - Presentation walkthrough

---

## 🆘 Still Having Issues?

1. **Check Docker is running**:
   ```powershell
   docker ps
   ```

2. **Check Node.js is available**:
   ```powershell
   node --version
   npm --version
   ```

3. **View project structure**:
   ```powershell
   tree /F /A
   ```

4. **Check ports are free**:
   ```powershell
   netstat -ano | findstr :3000
   netstat -ano | findstr :5000
   ```

5. **Read logs**:
   ```powershell
   # Docker
   docker-compose logs -f

   # Manual
   Check terminal output
   ```

---

## ✅ Setup Verification Checklist

Before presentation, verify:

- [ ] Docker Desktop running
- [ ] Node.js installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Docker images built (`docker images | grep 2fa-attacks`)
- [ ] Services running (`docker-compose ps` shows both healthy)
- [ ] Frontend accessible (http://localhost:3000)
- [ ] Backend accessible (http://localhost:5000/api/health)
- [ ] Database has data (`docker-compose exec backend node show-evidence.js`)
- [ ] Can execute attacks from UI
- [ ] Can view evidence

---

## 🎓 For Your Presentation

**Best Approach**:
1. Start Docker before class: `.\docker-start.ps1`
2. Verify both services running: `docker-compose ps`
3. Open browser to http://localhost:3000
4. Execute attacks live
5. Show evidence: `docker-compose exec backend node show-evidence.js`
6. Show professionalism with containerized deployment

**Backup Plan**:
If Docker fails, use manual setup:
1. Terminal 1: `cd backend ; npm start`
2. Terminal 2: `cd frontend ; npm run dev`
3. Same UI and functionality

---

**You're ready! 🚀**
