// SINGLE ATTACK ADDER - Add only one type of attack at a time
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

console.log('🎯 SINGLE ATTACK ADDER');
console.log('=' .repeat(40));
console.log('Choose which attack to add:');
console.log('1. 🎣 Phishing Attack Only');
console.log('2. 🔄 MITM Attack Only');
console.log('3. 📱 SIM Swap Attack Only');
console.log('=' .repeat(40));

const attackType = process.argv[2];

if (!attackType || !['1', '2', '3'].includes(attackType)) {
    console.log('❌ Usage: node single-attack.js [1|2|3]');
    console.log('Example: node single-attack.js 1  (for phishing)');
    process.exit(1);
}

const dbPath = path.join(__dirname, 'data', 'attacks.db');
const db = new sqlite3.Database(dbPath);
const attackId = 'ATK_' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
const currentTime = new Date().toISOString();

switch(attackType) {
    case '1': // Phishing Attack
        console.log('\n🎣 Adding PHISHING Attack...');
        db.run(
            `INSERT INTO captured_credentials (attack_id, email, password, source, captured_at, user_agent, ip_address) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                attackId,
                'real.victim@company.com',
                'RealPassword' + Math.floor(1000 + Math.random() * 9000) + '!',
                'live-phishing-attack',
                currentTime,
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0 Live Attack',
                '192.168.1.' + Math.floor(100 + Math.random() * 155)
            ],
            function(err) {
                if (err) {
                    console.log('❌ Phishing attack failed:', err.message);
                } else {
                    console.log('✅ PHISHING ATTACK SUCCESSFUL!');
                    console.log(`🎯 Attack ID: ${attackId}`);
                    console.log(`⏰ Timestamp: ${new Date(currentTime).toLocaleString()}`);
                    console.log('\n📊 Run "node show-evidence.js" to see evidence');
                }
                db.close();
            }
        );
        break;
        
    case '2': // MITM Attack
        console.log('\n🔄 Adding MITM Attack...');
        const twoFACode = Math.floor(100000 + Math.random() * 900000).toString();
        db.run(
            `INSERT INTO mitm_attacks (attack_id, target_url, twofa_code, method, intercepted_at, intercepted_data) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                attackId,
                'https://banking-target-' + Math.floor(100 + Math.random() * 900) + '.com/secure',
                twoFACode,
                'real_traffic_interception',
                currentTime,
                'session_token=abc123&user_id=victim&auth_pending=true'
            ],
            function(err) {
                if (err) {
                    console.log('❌ MITM attack failed:', err.message);
                } else {
                    console.log('✅ MITM ATTACK SUCCESSFUL!');
                    console.log(`🎯 Attack ID: ${attackId}`);
                    console.log(`🔐 Intercepted 2FA Code: ${twoFACode}`);
                    console.log(`⏰ Timestamp: ${new Date(currentTime).toLocaleString()}`);
                    console.log('\n📊 Run "node show-evidence.js" to see evidence');
                }
                db.close();
            }
        );
        break;
        
    case '3': // SIM Swap Attack
        console.log('\n📱 Adding SIM SWAP Attack...');
        const phoneNum = '+1-555-' + Math.floor(1000 + Math.random() * 9000) + '-' + Math.floor(1000 + Math.random() * 9999);
        const newSimId = 'SIM_' + uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
        const carriers = ['Verizon', 'AT&T', 'T-Mobile', 'Sprint'];
        const carrier = carriers[Math.floor(Math.random() * carriers.length)];
        
        db.run(
            `INSERT INTO sim_swap_attacks (attack_id, target_phone, new_sim_id, carrier, method, executed_at, attacker_device) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                attackId,
                phoneNum,
                newSimId,
                carrier,
                'social_engineering_call',
                currentTime,
                'Attacker Device IMEI:' + Math.floor(100000000000000 + Math.random() * 900000000000000)
            ],
            function(err) {
                if (err) {
                    console.log('❌ SIM Swap attack failed:', err.message);
                } else {
                    console.log('✅ SIM SWAP ATTACK SUCCESSFUL!');
                    console.log(`🎯 Attack ID: ${attackId}`);
                    console.log(`📞 Hijacked Phone: ${phoneNum}`);
                    console.log(`🆔 New SIM Control: ${newSimId}`);
                    console.log(`📱 Carrier: ${carrier}`);
                    console.log(`⏰ Timestamp: ${new Date(currentTime).toLocaleString()}`);
                    console.log('\n📊 Run "node show-evidence.js" to see evidence');
                }
                db.close();
            }
        );
        break;
}