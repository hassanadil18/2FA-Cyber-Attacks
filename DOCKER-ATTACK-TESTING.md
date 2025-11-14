# 🎯 Docker Attack Simulation - Testing Guide

## ✅ FIXED: Attack Simulation Ports

### **What Was Fixed:**
- ✅ Added port mappings for attack simulation servers
- ✅ Exposed ports: 8080 (MITM), 9090-9092 (Phishing)
- ✅ Updated Dockerfile to expose attack ports
- ✅ Containers can now host attack servers accessible from host machine

---

## 🔌 Exposed Ports

| Port | Purpose | Used By |
|------|---------|---------|
| 5000 | Backend API | Main application |
| 8080 | MITM Proxy Server | MITM attacks |
| 9090 | Phishing Server | Phishing attacks (primary) |
| 9091 | Phishing Server | Phishing attacks (alternate) |
| 9092 | Phishing Server | Phishing attacks (alternate) |
| 3000 | Frontend UI | React application |

---

## 🧪 How to Test Attacks

### **Step 1: Start Docker Containers**
```powershell
cd "A:\Information Secuirty Semester Project\2FA attacks\2FA-Cyber-Attacks-Lab"
docker-compose up -d
```

### **Step 2: Open Frontend**
```powershell
start http://localhost:3000
```

### **Step 3: Execute Attack from UI**

#### **Option A: Use Demo Mode (No Login Required)**
The frontend may have a demo/guest mode that allows testing without authentication.

#### **Option B: Login First**
If authentication is required, you'll need to create a user or use existing credentials.

---

## 🎣 Testing Phishing Attack

### **1. Execute Phishing Attack:**
- Go to http://localhost:3000
- Navigate to "Attack Simulation" tab
- Fill in phishing attack form:
  - Target Email: `victim@example.com`
  - Attack Type: `Credential Harvesting`
  - Template: `Fake Login Page`
- Click "Execute Phishing Attack"

### **2. Get Phishing URL:**
The response will show something like:
```json
{
  "attack_id": "abc-123-def",
  "phishing_url": "http://localhost:9090/login?target=victim@example.com&id=abc-123-def",
  "status": "active"
}
```

### **3. Access Phishing Page:**
- Copy the `phishing_url` from the response
- Open it in a new browser tab
- You should see a fake login page
- Enter test credentials to see them captured

### **4. View Captured Data:**
```powershell
docker-compose exec backend node show-evidence.js
```

---

## 🔄 Testing MITM Attack

### **1. Execute MITM Attack:**
- Go to "Attack Simulation" → "MITM Attack" tab
- Fill in:
  - Target Phone: `+1234567890`
  - Attack Method: `Session Hijacking`
  - Intercept Type: `2FA Codes`
- Click "Execute MITM Attack"

### **2. Get Proxy URL:**
Response shows:
```json
{
  "attack_id": "xyz-456-abc",
  "proxy_url": "http://localhost:8080",
  "status": "active"
}
```

### **3. Configure Browser Proxy (Optional Test):**
To see MITM in action:
- Browser Settings → Network → Proxy
- Set HTTP Proxy: `localhost`
- Port: `8080`
- Browse any site to see traffic interception

### **4. View Intercepted Data:**
```powershell
docker-compose exec backend node show-evidence.js
```

---

## 📱 Testing SIM Swap Attack

### **1. Execute SIM Swap Attack:**
- Go to "SIM Swap Attack" tab
- Fill in:
  - Target Phone: `+1234567890`
  - Carrier: `Verizon`
  - Attack Method: `Social Engineering`
- Click "Execute SIM Swap Attack"

### **2. View Results:**
Shows simulated SIM swap with:
- New SIM card ID
- Hijacked phone number
- Captured 2FA codes

---

## 🧪 Quick Verification Tests

### **Test 1: Check Ports Are Open**
```powershell
Test-NetConnection -ComputerName localhost -Port 9090
Test-NetConnection -ComputerName localhost -Port 8080
```
Both should return `TcpTestSucceeded: True`

### **Test 2: Add Test Attack Data**
```powershell
docker-compose exec backend node single-attack.js 1  # Phishing
docker-compose exec backend node single-attack.js 2  # MITM
docker-compose exec backend node single-attack.js 3  # SIM Swap
```

### **Test 3: View Evidence**
```powershell
docker-compose exec backend node show-evidence.js
```

### **Test 4: Check Container Logs**
```powershell
# View all logs
docker-compose logs -f

# View backend only
docker-compose logs -f backend

# Check for attack server messages
docker-compose logs backend | Select-String -Pattern "port|attack|server"
```

---

## 🔍 Troubleshooting

### **Issue: "Cannot access phishing URL"**

**Check 1: Is the port accessible?**
```powershell
Test-NetConnection localhost -Port 9090
```

**Check 2: Is the attack server running?**
```powershell
docker-compose logs backend | Select-String -Pattern "phishing|9090"
```

**Check 3: Get the correct URL**
After executing attack, look for:
```
🎣 [PHISHING ATTACK] Server started for: victim@example.com
🔗 Phishing URL: http://localhost:9090/login...
🚀 Server running on port: 9090
```

---

### **Issue: "MITM proxy not working"**

**Check 1: Port 8080 is open**
```powershell
Test-NetConnection localhost -Port 8080
```

**Check 2: Attack was executed**
```powershell
docker-compose logs backend | Select-String -Pattern "mitm|8080|proxy"
```

**Check 3: Browser proxy is configured correctly**
- Proxy: `localhost` or `127.0.0.1`
- Port: `8080`
- Type: HTTP proxy

---

### **Issue: "Authentication required" error**

This means the frontend needs you to log in first.

**Solution 1: Check if there's a demo mode**
Look for "Demo Mode" or "Guest Access" button on the frontend

**Solution 2: Create a user**
Check backend logs for default credentials or user creation scripts

**Solution 3: Bypass auth for testing (Development only)**
Modify `backend/src/routes/attacks.js` to use `optionalAuth` instead of `authMiddleware`

---

### **Issue: "Ports already in use"**

**Check what's using the port:**
```powershell
netstat -ano | findstr :9090
netstat -ano | findstr :8080
```

**Kill the process:**
```powershell
taskkill /PID <PID> /F
```

**Or restart containers:**
```powershell
docker-compose restart
```

---

## 🎯 Complete Test Sequence

### **Full Demo Test:**
```powershell
# 1. Start containers
docker-compose up -d

# 2. Wait for healthy status
Start-Sleep -Seconds 10
docker-compose ps

# 3. Add test data
docker-compose exec backend node single-attack.js 1
docker-compose exec backend node single-attack.js 2
docker-compose exec backend node single-attack.js 3

# 4. View evidence
docker-compose exec backend node show-evidence.js

# 5. Open frontend
start http://localhost:3000

# 6. Test phishing URL (from backend logs)
docker-compose logs backend | Select-String -Pattern "Phishing URL"
```

---

## 📊 Expected Output

### **After executing phishing attack:**
```
🎣 [PHISHING ATTACK] Server started for: test@victim.com
📧 Subject: "Urgent: Verify Your 2FA Settings"
🔗 Phishing URL: http://localhost:9090/login?target=test@victim.com&id=abc123
🚀 Server running on port: 9090
```

### **After executing MITM attack:**
```
🔄 [MITM ATTACK] Proxy server started
📡 Proxy URL: http://localhost:8080
🎯 Intercepting: 2FA codes and authentication tokens
```

### **When accessing phishing URL:**
Browser shows a realistic fake login page where you can enter credentials.

### **After submitting fake credentials:**
```
🎯 [CREDENTIALS CAPTURED] Attack ID: abc123
👤 Username: victim@bank.com
🔑 Password: ********
📱 2FA Code: 123456
```

---

## ✅ Verification Checklist

Before your presentation:

- [ ] Docker containers running: `docker-compose ps`
- [ ] Backend healthy: http://localhost:5000/api/health
- [ ] Frontend accessible: http://localhost:3000
- [ ] Port 9090 accessible: `Test-NetConnection localhost -Port 9090`
- [ ] Port 8080 accessible: `Test-NetConnection localhost -Port 8080`
- [ ] Can execute attacks from UI
- [ ] Phishing URL opens in browser
- [ ] Can view evidence: `docker-compose exec backend node show-evidence.js`
- [ ] Test data exists in database

---

## 🎓 For Your Presentation

### **Demo Sequence:**

1. **Show running containers:**
   ```powershell
   docker-compose ps
   ```

2. **Open frontend:**
   ```
   http://localhost:3000
   ```

3. **Execute phishing attack** from UI

4. **Copy phishing URL** from response

5. **Open phishing URL** in new tab to show fake login page

6. **Enter fake credentials** to demonstrate capture

7. **Show captured data:**
   ```powershell
   docker-compose exec backend node show-evidence.js
   ```

8. **Repeat for MITM and SIM Swap attacks**

---

## 🚀 Quick Commands Reference

```powershell
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f backend

# Add test attacks
docker-compose exec backend node single-attack.js 1

# View evidence
docker-compose exec backend node show-evidence.js

# Restart
docker-compose restart

# Check ports
Test-NetConnection localhost -Port 9090
Test-NetConnection localhost -Port 8080

# Rebuild after code changes
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

**Your attack simulation ports are now properly exposed and working! 🎉**
