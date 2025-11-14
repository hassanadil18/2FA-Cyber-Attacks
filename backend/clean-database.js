// CLEAN DATABASE - Remove all old attack data for fresh presentation
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🗑️ CLEANING ATTACK DATABASE');
console.log('=' .repeat(40));
console.log('⚠️  This will DELETE all existing attack evidence!');
console.log('Use this to start fresh for presentation.');
console.log('=' .repeat(40));

const dbPath = path.join(__dirname, 'data', 'attacks.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('\n🧹 Clearing all attack tables...');
    
    // Clear all tables
    db.run('DELETE FROM captured_credentials', (err) => {
        if (err) {
            console.log('❌ Error clearing phishing data:', err.message);
        } else {
            console.log('✅ Phishing attacks cleared');
        }
    });
    
    db.run('DELETE FROM mitm_attacks', (err) => {
        if (err) {
            console.log('❌ Error clearing MITM data:', err.message);
        } else {
            console.log('✅ MITM attacks cleared');
        }
    });
    
    db.run('DELETE FROM sim_swap_attacks', (err) => {
        if (err) {
            console.log('❌ Error clearing SIM swap data:', err.message);
        } else {
            console.log('✅ SIM swap attacks cleared');
        }
        
        console.log('\n🔥 DATABASE CLEANED SUCCESSFULLY!');
        console.log('=' .repeat(40));
        console.log('💡 Now you can add attacks one by one:');
        console.log('   node single-attack.js 1  (phishing)');
        console.log('   node single-attack.js 2  (mitm)');
        console.log('   node single-attack.js 3  (sim swap)');
        console.log('\n📊 Check evidence: node show-evidence.js');
        
        db.close();
    });
});