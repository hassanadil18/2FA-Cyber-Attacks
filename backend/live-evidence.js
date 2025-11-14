// LIVE EVIDENCE VIEWER - Shows LATEST attack data in real-time
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'attacks.db');
const db = new sqlite3.Database(dbPath);

console.log('🔥 LIVE ATTACK EVIDENCE - LATEST CAPTURES');
console.log('=' .repeat(60));
console.log(`⏰ Generated: ${new Date().toLocaleString()}`);
console.log('=' .repeat(60));

// Show LATEST Phishing Evidence (most recent first)
db.get("SELECT COUNT(*) as total FROM captured_credentials", (err, count) => {
    if (err) {
        console.error('❌ Database Error:', err);
        return;
    }
    
    console.log(`\n🎣 PHISHING ATTACKS: ${count.total} total captures`);
    
    db.all("SELECT * FROM captured_credentials ORDER BY captured_at DESC LIMIT 3", (err, rows) => {
        if (err) {
            console.error('❌ Error:', err);
            return;
        }
        
        if (rows.length === 0) {
            console.log('📝 No phishing captures yet - Run live attack to generate evidence');
        } else {
            rows.forEach((row, index) => {
                console.log(`\n📋 LATEST PHISHING CAPTURE #${index + 1}:`);
                console.log(`🎯 Attack ID: ${row.attack_id}`);
                console.log(`📧 Captured Email: ${row.email}`);
                console.log(`🔑 Captured Password: ${'*'.repeat(row.password.length)} (${row.password.length} chars)`);
                console.log(`⏰ Timestamp: ${new Date(row.captured_at).toLocaleString()}`);
                console.log(`🌐 Attack Source: ${row.source || 'phishing-site'}`);
                console.log(`🆔 User Agent: ${row.user_agent ? row.user_agent.substring(0, 50) + '...' : 'Not captured'}`);
            });
        }
        
        // Show LATEST MITM Evidence
        db.get("SELECT COUNT(*) as total FROM mitm_attacks", (err, count) => {
            if (err) return;
            
            console.log(`\n🔄 MITM ATTACKS: ${count.total} total interceptions`);
            
            db.all("SELECT * FROM mitm_attacks ORDER BY intercepted_at DESC LIMIT 3", (err, rows) => {
                if (err) return;
                
                if (rows.length === 0) {
                    console.log('📝 No MITM captures yet - Run live attack to generate evidence');
                } else {
                    rows.forEach((row, index) => {
                        console.log(`\n📋 LATEST MITM INTERCEPTION #${index + 1}:`);
                        console.log(`🎯 Attack ID: ${row.attack_id}`);
                        console.log(`🔐 Intercepted 2FA Code: ${row.twofa_code}`);
                        console.log(`🌐 Target URL: ${row.target_url}`);
                        console.log(`⏰ Intercepted At: ${new Date(row.intercepted_at).toLocaleString()}`);
                        console.log(`📊 Method: ${row.method || 'Traffic Interception'}`);
                    });
                }
                
                // Show LATEST SIM Swap Evidence  
                db.get("SELECT COUNT(*) as total FROM sim_swap_attacks", (err, count) => {
                    if (err) return;
                    
                    console.log(`\n📱 SIM SWAP ATTACKS: ${count.total} total hijacks`);
                    
                    db.all("SELECT * FROM sim_swap_attacks ORDER BY executed_at DESC LIMIT 3", (err, rows) => {
                        if (err) return;
                        
                        if (rows.length === 0) {
                            console.log('📝 No SIM swaps yet - Run live attack to generate evidence');
                        } else {
                            rows.forEach((row, index) => {
                                console.log(`\n📋 LATEST SIM SWAP #${index + 1}:`);
                                console.log(`🎯 Attack ID: ${row.attack_id}`);
                                console.log(`📞 Hijacked Phone: ${row.target_phone}`);
                                console.log(`🆔 New SIM Control: ${row.new_sim_id}`);
                                console.log(`📱 Compromised Carrier: ${row.carrier}`);
                                console.log(`⏰ Hijacked At: ${new Date(row.executed_at).toLocaleString()}`);
                                console.log(`🎭 Attack Method: ${row.method || 'Social Engineering'}`);
                            });
                        }
                        
                        // Final Summary
                        console.log('\n' + '=' .repeat(60));
                        console.log('🔥 LIVE EVIDENCE SUMMARY:');
                        console.log('✅ Real attack data with timestamps');
                        console.log('✅ Unique attack IDs for each capture');
                        console.log('✅ Stored in SQLite database permanently');
                        console.log('✅ API accessible at http://localhost:5000/api/attacks/evidence/');
                        console.log('🎯 READY FOR LIVE PRESENTATION!');
                        console.log('=' .repeat(60));
                        
                        db.close();
                    });
                });
            });
        });
    });
});