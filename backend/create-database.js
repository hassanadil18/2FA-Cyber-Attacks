// CREATE DATABASE TABLES FOR ATTACK EVIDENCE
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'attacks.db');
const db = new sqlite3.Database(dbPath);

console.log('🔥 Creating Database Tables for Attack Evidence...');

db.serialize(() => {
    // Create Phishing Attacks Table
    db.run(`CREATE TABLE IF NOT EXISTS captured_credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attack_id TEXT UNIQUE,
        email TEXT,
        password TEXT,
        source TEXT,
        user_agent TEXT,
        ip_address TEXT,
        captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating phishing table:', err);
        } else {
            console.log('✅ Phishing attacks table created');
        }
    });

    // Create MITM Attacks Table
    db.run(`CREATE TABLE IF NOT EXISTS mitm_attacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attack_id TEXT UNIQUE,
        target_url TEXT,
        intercepted_data TEXT,
        twofa_code TEXT,
        method TEXT,
        intercepted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating MITM table:', err);
        } else {
            console.log('✅ MITM attacks table created');
        }
    });

    // Create SIM Swap Attacks Table
    db.run(`CREATE TABLE IF NOT EXISTS sim_swap_attacks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attack_id TEXT UNIQUE,
        target_phone TEXT,
        carrier TEXT,
        method TEXT,
        new_sim_id TEXT,
        attacker_device TEXT,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('❌ Error creating SIM swap table:', err);
        } else {
            console.log('✅ SIM swap attacks table created');
        }
    });

    // Insert demo data for presentation
    console.log('\n🎯 Adding Demo Attack Evidence...');
    
    // Demo Phishing Attack
    const phishingId = 'ATK_' + Math.random().toString(16).substr(2, 8).toUpperCase();
    db.run(`INSERT OR REPLACE INTO captured_credentials 
            (attack_id, email, password, source, user_agent, ip_address) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [phishingId, 'victim@company.com', 'MySecurePassword123!', 'live-phishing-demo', 'Mozilla/5.0 (Demo Browser)', '192.168.1.100'], 
            (err) => {
                if (!err) {
                    console.log(`✅ Demo Phishing Attack: ${phishingId}`);
                    console.log('   📧 Email: victim@company.com');
                    console.log('   🔑 Password: MySecurePassword123!');
                }
            });

    // Demo MITM Attack
    const mitmId = 'ATK_' + Math.random().toString(16).substr(2, 8).toUpperCase();
    db.run(`INSERT OR REPLACE INTO mitm_attacks 
            (attack_id, target_url, intercepted_data, twofa_code, method) 
            VALUES (?, ?, ?, ?, ?)`, 
            [mitmId, 'https://secure-banking.com/login', 'username=victim&password=secret', '567890', 'proxy_interception'], 
            (err) => {
                if (!err) {
                    console.log(`✅ Demo MITM Attack: ${mitmId}`);
                    console.log('   🌐 Target: https://secure-banking.com/login');
                    console.log('   🔐 2FA Code: 567890');
                }
            });

    // Demo SIM Swap Attack
    const simSwapId = 'ATK_' + Math.random().toString(16).substr(2, 8).toUpperCase();
    const newSimId = 'SIM_' + Math.random().toString(16).substr(2, 8).toUpperCase();
    db.run(`INSERT OR REPLACE INTO sim_swap_attacks 
            (attack_id, target_phone, carrier, method, new_sim_id, attacker_device) 
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [simSwapId, '+1-555-123-4567', 'Verizon Wireless', 'social_engineering', newSimId, 'Attacker iPhone'], 
            (err) => {
                if (!err) {
                    console.log(`✅ Demo SIM Swap Attack: ${simSwapId}`);
                    console.log('   📞 Target Phone: +1-555-123-4567');
                    console.log('   🆔 New SIM ID: ' + newSimId);
                }
            });

    setTimeout(() => {
        console.log('\n🔥 DATABASE READY FOR PRESENTATION!');
        console.log('\nNow run: node show-evidence.js');
        db.close();
    }, 1000);
});