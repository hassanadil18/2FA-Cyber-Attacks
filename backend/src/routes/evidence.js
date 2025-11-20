const express = require('express');
const database = require('../models/database');
const PhishingAttack = require('../attacks/PhishingAttack');
const MITMAttack = require('../attacks/MITMAttack');
const SIMSwapAttack = require('../attacks/SIMSwapAttack');

const router = express.Router();

// Get phishing attack evidence
router.get('/evidence/phishing', async (req, res) => {
 try {
 const db = database.getDB();
 
 // Get phishing credentials from database
 db.all(`
 SELECT 
 attack_logs.id as attack_id,
 attack_logs.created_at,
 captured_credentials.email,
 captured_credentials.password,
 captured_credentials.created_at as captured_at
 FROM attack_logs 
 LEFT JOIN captured_credentials ON attack_logs.id = captured_credentials.attack_id
 WHERE attack_logs.attack_type = 'phishing' 
 ORDER BY attack_logs.created_at DESC
 LIMIT 10
 `, [], (err, rows) => {
 if (err) {
 console.error('Database error:', err);
 return res.status(500).json({ error: 'Database error' });
 }
 
 const credentials = rows.filter(row => row.email && row.password);
 res.json({ 
 success: true, 
 credentials: credentials,
 total: credentials.length 
 });
 });
 
 } catch (error) {
 console.error('Error fetching phishing evidence:', error);
 res.status(500).json({ error: 'Server error' });
 }
});

// Get MITM attack evidence
router.get('/evidence/mitm', async (req, res) => {
 try {
 const db = database.getDB();
 
 db.all(`
 SELECT 
 id as attack_id,
 attack_data,
 created_at,
 status
 FROM attack_logs 
 WHERE attack_type = 'mitm' OR attack_type = 'MITM'
 ORDER BY created_at DESC
 LIMIT 10
 `, [], (err, rows) => {
 if (err) {
 console.error('Database error:', err);
 return res.status(500).json({ error: 'Database error' });
 }
 
 const intercepted = rows.map(row => {
 try {
 const data = JSON.parse(row.attack_data || '{}');
 return {
 attack_id: row.attack_id,
 twofa_code: data.intercepted_2fa_code || data.authCode || '123456',
 target_url: data.target_url || data.targetUrl || 'https://example.com/login',
 intercepted_at: row.created_at,
 status: row.status
 };
 } catch (e) {
 return {
 attack_id: row.attack_id,
 twofa_code: '567890',
 target_url: 'https://intercepted-site.com',
 intercepted_at: row.created_at,
 status: row.status
 };
 }
 });
 
 res.json({ 
 success: true, 
 intercepted: intercepted,
 total: intercepted.length 
 });
 });
 
 } catch (error) {
 console.error('Error fetching MITM evidence:', error);
 res.status(500).json({ error: 'Server error' });
 }
});

// Get SIM swap attack evidence
router.get('/evidence/simswap', async (req, res) => {
 try {
 const db = database.getDB();
 
 db.all(`
 SELECT 
 id as attack_id,
 attack_data,
 created_at,
 status
 FROM attack_logs 
 WHERE attack_type = 'sim_swap' OR attack_type = 'SIM_SWAP'
 ORDER BY created_at DESC
 LIMIT 10
 `, [], (err, rows) => {
 if (err) {
 console.error('Database error:', err);
 return res.status(500).json({ error: 'Database error' });
 }
 
 const swaps = rows.map(row => {
 try {
 const data = JSON.parse(row.attack_data || '{}');
 const swapExecution = data.swap_execution || {};
 
 return {
 attack_id: row.attack_id,
 target_phone: data.target_phone || '+1234567890',
 new_sim_id: swapExecution.new_sim_id || 'SIM' + Math.random().toString(16).substr(2, 8).toUpperCase(),
 status: row.status,
 carrier: data.carrier || 'Verizon',
 executed_at: row.created_at
 };
 } catch (e) {
 return {
 attack_id: row.attack_id,
 target_phone: '+1234567890',
 new_sim_id: 'SIM' + Math.random().toString(16).substr(2, 8).toUpperCase(),
 status: row.status,
 carrier: 'Unknown',
 executed_at: row.created_at
 };
 }
 });
 
 res.json({ 
 success: true, 
 swaps: swaps,
 total: swaps.length 
 });
 });
 
 } catch (error) {
 console.error('Error fetching SIM swap evidence:', error);
 res.status(500).json({ error: 'Server error' });
 }
});

// Demo endpoints for live presentation
router.post('/demo/phishing', async (req, res) => {
 try {
 const { email, password } = req.body;
 const phishing = new PhishingAttack();
 
 const result = await phishing.initiate({
 targetUrl: 'https://demo-bank.com/login',
 redirectUrl: 'https://real-bank.com'
 });
 
 // Simulate captured credentials
 const db = database.getDB();
 db.run(`
 INSERT INTO captured_credentials (attack_id, email, password, created_at)
 VALUES (?, ?, ?, datetime('now'))
 `, [result.attackId, email || 'demo@victim.com', password || 'DemoPassword123'], (err) => {
 if (err) console.error('Error inserting demo credentials:', err);
 });
 
 res.json({
 success: true,
 attackId: result.attackId,
 message: 'Phishing demo executed - credentials captured'
 });
 
 } catch (error) {
 console.error('Error in phishing demo:', error);
 res.status(500).json({ error: 'Demo failed' });
 }
});

router.post('/demo/mitm', async (req, res) => {
 try {
 const { target_url, twofa_code } = req.body;
 const mitm = new MITMAttack();
 
 const result = await mitm.initiate({
 targetUrl: target_url || 'https://demo-bank.com/login',
 proxyPort: 8080
 });
 
 // Simulate intercepted 2FA
 await mitm.simulateInterception(result.attackId, {
 authCode: twofa_code || '847392',
 targetUrl: target_url || 'https://demo-bank.com/login'
 });
 
 res.json({
 success: true,
 attackId: result.attackId,
 message: 'MITM demo executed - 2FA intercepted'
 });
 
 } catch (error) {
 console.error('Error in MITM demo:', error);
 res.status(500).json({ error: 'Demo failed' });
 }
});

router.post('/demo/simswap', async (req, res) => {
 try {
 const { targetPhoneNumber, carrierInfo } = req.body;
 const simSwap = new SIMSwapAttack();
 
 const result = await simSwap.initiate({
 targetPhoneNumber: targetPhoneNumber || '+1234567890',
 carrierInfo: carrierInfo || 'Verizon Wireless',
 method: 'social_engineering',
 attackerDevice: 'Demo Device - IMEI: 123456789012345'
 });
 
 // Execute the swap immediately for demo
 await simSwap.executeSwap(result.attackId);
 
 res.json({
 success: true,
 attackId: result.attackId,
 message: 'SIM swap demo executed - phone number hijacked'
 });
 
 } catch (error) {
 console.error('Error in SIM swap demo:', error);
 res.status(500).json({ error: 'Demo failed' });
 }
});

module.exports = router;