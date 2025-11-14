# 🎯 COMPLETE ATTACK FLOW EXPLANATION

## 📊 WHERE IS DATA STORED?

### Database Location:
```
📁 backend/
  📁 data/
    📄 attacks.db ← ALL ATTACK DATA STORED HERE
```

### Database Tables:
```sql
attack_logs
├── id (Attack ID like "ATK_9102B96D")
├── attack_type ("phishing", "mitm", "sim_swap")
├── attack_data (JSON with captured credentials)
├── status ("active", "successful", "failed")
└── timestamp (When attack happened)
```

### View Data Command:
```bash
node show-evidence.js
```

---

## 🎣 PHISHING ATTACK - COMPLETE FLOW

### Step 1: You Start Attack
```
React Frontend (AttackSimulation.tsx)
↓
User fills form:
- Target Email: victim@example.com
- Attack Type: Credential Harvesting
- Template: Fake Login Page
↓
Clicks "Execute Phishing Attack" button
```

### Step 2: API Receives Request
```
POST http://localhost:5000/api/attacks/phishing
Body: {
  target_email: "victim@example.com",
  attack_type: "credential_harvesting",
  template: "fake_login_page"
}
↓
backend/src/routes/attacks.js processes request
↓
Creates new PhishingAttack() instance
```

### Step 3: Phishing Server Starts
```
PhishingAttack.js → initiate() function
↓
Generates unique Attack ID: "ATK_9102B96D"
↓
Starts HTTP server on port 9090
↓
Creates phishing URL: http://localhost:9090/login?id=ATK_9102B96D
↓
REAL WEB SERVER NOW RUNNING!
```

### Step 4: Database Record Created
```
INSERT INTO attack_logs
VALUES (
  id: "ATK_9102B96D",
  attack_type: "phishing",
  status: "active",
  attack_data: {
    target_email: "victim@example.com",
    phishing_url: "http://localhost:9090/login",
    phishing_port: 9090,
    template: "fake_login_page"
  }
)
```

### Step 5: Victim Clicks Link
```
Victim opens: http://localhost:9090/login
↓
PhishingAttack.js → handlePhishingRequest()
↓
Serves fake login page HTML
↓
Victim sees fake bank/email login page
```

### Step 6: Victim Enters Credentials
```
Victim fills form:
- Username: victim@bank.com
- Password: MySecureP@ss123
- 2FA Code: 456789
↓
Clicks "Login" button
↓
Form submits to http://localhost:9090/login (POST)
```

### Step 7: Credentials Captured
```
PhishingAttack.js → captureCredentials()
↓
Extracts data from form:
{
  username: "victim@bank.com",
  password: "MySecureP@ss123",
  otp: "456789",
  timestamp: "2025-01-15T10:30:00Z"
}
↓
Console logs: "🎯 CREDENTIALS CAPTURED"
```

### Step 8: Database Updated
```
UPDATE attack_logs
SET 
  success = 1,
  status = "successful"
WHERE id = "ATK_9102B96D"

INSERT INTO attack_logs
VALUES (
  id: "ATK_9102B96D_credentials",
  attack_type: "credential_capture",
  attack_data: {
    username: "victim@bank.com",
    password: "MySecureP@ss123",
    otp: "456789"
  }
)
```

### Step 9: You View Evidence
```bash
node show-evidence.js
```

Output:
```
🎯 PHISHING ATTACKS
═══════════════════════════════════════════════════════
Attack ID: ATK_9102B96D
Target: victim@bank.com
Username: victim@bank.com
Password: MySecureP@ss123
2FA Code: 456789
Timestamp: 2025-01-15 10:30:00
Status: ✅ SUCCESSFUL
```

---

## 🔍 MITM ATTACK - COMPLETE FLOW

### What Happens:
```
1. You execute MITM attack from React UI
2. API creates MITMAttack instance
3. Attack simulates:
   - Intercepting network traffic
   - Capturing SMS 2FA codes
   - Recording phone numbers
4. Data stored in database:
   {
     intercepted_messages: ["2FA Code: 123456", "Verification: 789012"],
     target_phone: "+1234567890",
     attack_method: "session_hijacking"
   }
5. You view evidence with show-evidence.js
```

---

## 📱 SIM SWAP ATTACK - COMPLETE FLOW

### What Happens:
```
1. You execute SIM Swap attack from React UI
2. API creates SIMSwapAttack instance
3. Attack simulates:
   - Social engineering carrier
   - Porting phone number
   - Receiving 2FA codes on new SIM
4. Data stored in database:
   {
     target_phone: "+1234567890",
     carrier: "Verizon",
     swap_successful: true,
     captured_codes: ["456789", "123456"]
   }
5. You view evidence with show-evidence.js
```

---

## ✅ HOW TO VERIFY ATTACKS WORK

### Test Method 1: Complete End-to-End Test
```bash
# Terminal 1: Start backend
cd backend
npm start

# Terminal 2: Start frontend
cd frontend
npm start

# Terminal 3: Run test script
cd backend
node test-attack-flow.js
```

### Test Method 2: Manual UI Testing
```
1. Open React app: http://localhost:3000
2. Go to "Attack Simulation" tab
3. Fill phishing form:
   - Target: test@victim.com
   - Attack Type: Credential Harvesting
   - Template: Fake Login
4. Click "Execute Phishing Attack"
5. See response with phishing URL
6. Open phishing URL in new tab
7. Enter fake credentials:
   - Username: victim@bank.com
   - Password: testpass123
   - 2FA: 456789
8. Submit form
9. Run: node show-evidence.js
10. See captured credentials!
```

### Test Method 3: Single Attack Script
```bash
# Add one phishing attack
node single-attack.js 1

# Add one MITM attack
node single-attack.js 2

# Add one SIM Swap attack
node single-attack.js 3

# View all evidence
node show-evidence.js
```

---

## 🎓 PRESENTATION DEMO SEQUENCE

### Preparation (Before Class):
```bash
1. cd backend && npm start          # Start server
2. cd frontend && npm start         # Start React app
3. node clean-database.js           # Clear old data
4. node show-evidence.js            # Verify clean database
```

### During Presentation:

#### Part 1: Show React Interface (2 minutes)
```
- Open http://localhost:3000
- Show professional attack dashboard
- Explain each attack type tab
```

#### Part 2: Execute Phishing Attack (5 minutes)
```
- Fill phishing form
- Click "Execute Attack"
- Show attack ID in response
- Open phishing URL in browser
- Show fake login page to class
- Enter credentials live
- Show "success" message
```

#### Part 3: Show Evidence (3 minutes)
```bash
- Run: node show-evidence.js
- Show captured credentials on screen
- Highlight Attack ID matches
- Show timestamp, username, password, 2FA code
```

#### Part 4: Execute MITM Attack (2 minutes)
```
- Switch to MITM tab
- Fill form and execute
- Show intercepted messages
```

#### Part 5: Execute SIM Swap Attack (2 minutes)
```
- Switch to SIM Swap tab
- Fill form and execute
- Show captured 2FA codes
```

#### Part 6: Final Evidence Display (2 minutes)
```bash
- Run: node show-evidence.js
- Show ALL attacks captured
- Prove complete working system
```

---

## 💾 DATA PERSISTENCE

### Where Files Are:
```
backend/
├── data/
│   └── attacks.db ← SQLite database (all attacks stored here)
├── show-evidence.js ← View captured data
├── single-attack.js ← Add test attacks
├── clean-database.js ← Reset database
└── test-attack-flow.js ← Test complete flow
```

### Database Contents:
```sql
-- View all attacks
SELECT * FROM attack_logs;

-- View only phishing
SELECT * FROM attack_logs WHERE attack_type = 'phishing';

-- View only successful
SELECT * FROM attack_logs WHERE success = 1;
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "Cannot connect to backend"
```
Fix: Make sure backend is running
cd backend && npm start
```

### Issue 2: "No evidence showing"
```
Fix: Execute attacks first, then run:
node show-evidence.js
```

### Issue 3: "Phishing server not starting"
```
Fix: Port 9090 might be busy
Kill process: netstat -ano | findstr :9090
Or restart computer
```

### Issue 4: "Database empty"
```
Fix: Execute attacks from React UI first
Or run: node single-attack.js 1
```

---

## 🎯 QUICK CHEAT SHEET

### Start System:
```bash
cd backend && npm start      # Terminal 1
cd frontend && npm start     # Terminal 2
```

### Test Attacks:
```bash
cd backend
node test-attack-flow.js     # Complete test
```

### View Evidence:
```bash
cd backend
node show-evidence.js        # Show all captured data
```

### Reset Database:
```bash
cd backend
node clean-database.js       # Clear all attacks
```

### Add Test Data:
```bash
cd backend
node single-attack.js 1      # Phishing
node single-attack.js 2      # MITM
node single-attack.js 3      # SIM Swap
```

---

## 📋 PRESENTATION CHECKLIST

Before class, verify:
- [ ] Backend running (npm start in backend/)
- [ ] Frontend running (npm start in frontend/)
- [ ] Database clean (node clean-database.js)
- [ ] Test attack works (node test-attack-flow.js)
- [ ] Can view evidence (node show-evidence.js)
- [ ] Phishing URL opens in browser
- [ ] All three attack types execute
- [ ] Have backup test data (node single-attack.js 1 2 3)

---

## 🎓 KEY POINTS FOR CLASS

### What To Emphasize:
1. **Real Working System**: Not just slides, actual functional code
2. **Complete Data Flow**: React → API → Attack Classes → Database
3. **Evidence Collection**: Can see captured credentials in database
4. **Security Implications**: Show how easy it is to fall victim
5. **Defense Strategies**: Explain how to prevent these attacks

### Questions They Might Ask:

**Q: "Where is the data stored?"**
A: "In SQLite database at backend/data/attacks.db, viewable with show-evidence.js"

**Q: "Is this a real phishing attack?"**
A: "Yes, it's a real HTTP server on localhost that captures credentials"

**Q: "How do you know it works?"**
A: "I'll show you - let me execute an attack and show the evidence [run show-evidence.js]"

**Q: "Can this be used for real attacks?"**
A: "Only on localhost for education. Never use against real targets - that's illegal."

---

## 🎬 FINAL CONFIDENCE BOOSTER

### You Have:
✅ Working backend server
✅ Professional React frontend
✅ Real SQLite database
✅ Actual phishing HTTP server
✅ Evidence collection scripts
✅ Complete attack simulations
✅ Test scripts to verify everything

### You Can:
✅ Execute attacks live in class
✅ Show captured credentials
✅ Open phishing pages in browser
✅ Prove attacks work end-to-end
✅ Explain complete technical flow

### Your System Is:
✅ Professional
✅ Functional
✅ Educational
✅ Demonstrable
✅ Complete

**YOU ARE READY TO PRESENT! 🚀**
