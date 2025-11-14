// QUICK EVIDENCE VIEWER - Run this to show captured attack data
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'attacks.db');
const db = new sqlite3.Database(dbPath);

console.log('🔥 2FA ATTACKS - EVIDENCE SUMMARY');
console.log('=' .repeat(50));

// Show Phishing Evidence
db.all("SELECT * FROM captured_credentials ORDER BY captured_at DESC LIMIT 5", (err, rows) => {
    if (err) {
        console.error('❌ Error:', err);
        return;
    }
    
    console.log('\n🎣 PHISHING ATTACK EVIDENCE:');
    console.log(`📊 Total Captured: ${rows.length}`);
    
    rows.forEach((row, index) => {
        console.log(`\n📋 Attack #${index + 1}:`);
        console.log(`🎯 Attack ID: ${row.attack_id}`);
        console.log(`📧 Email: ${row.email}`);
        console.log(`🔑 Password: ${row.password}`);
        console.log(`⏰ Captured: ${new Date(row.captured_at).toLocaleString()}`);
        console.log(`🌐 Source: ${row.source || 'phishing-site'}`);
    });
});

// Show MITM Evidence
db.all("SELECT * FROM mitm_attacks ORDER BY intercepted_at DESC LIMIT 5", (err, rows) => {
    if (err) return;
    
    console.log('\n🔄 MITM ATTACK EVIDENCE:');
    console.log(`📊 Total Intercepted: ${rows.length}`);
    
    rows.forEach((row, index) => {
        console.log(`\n📋 Interception #${index + 1}:`);
        console.log(`🎯 Attack ID: ${row.attack_id}`);
        console.log(`🔐 2FA Code: ${row.twofa_code}`);
        console.log(`🌐 Target: ${row.target_url}`);
        console.log(`⏰ Intercepted: ${new Date(row.intercepted_at).toLocaleString()}`);
    });
});

// Show SIM Swap Evidence  
db.all("SELECT * FROM sim_swap_attacks ORDER BY executed_at DESC LIMIT 5", (err, rows) => {
    if (err) return;
    
    console.log('\n📱 SIM SWAP ATTACK EVIDENCE:');
    console.log(`📊 Total SIM Swaps: ${rows.length}`);
    
    rows.forEach((row, index) => {
        console.log(`\n📋 SIM Swap #${index + 1}:`);
        console.log(`🎯 Attack ID: ${row.attack_id}`);
        console.log(`📞 Target Phone: ${row.target_phone}`);
        console.log(`🆔 New SIM: ${row.new_sim_id}`);
        console.log(`📱 Carrier: ${row.carrier}`);
        console.log(`⏰ Executed: ${new Date(row.executed_at).toLocaleString()}`);
    });
    
    console.log('\n🔥 PRESENTATION COMPLETE - ALL EVIDENCE SHOWN!');
    console.log('=' .repeat(50));
    db.close();
});