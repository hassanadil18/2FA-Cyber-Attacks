const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const WebAuthnDefense = require('../defenses/WebAuthnDefense');
const DeviceBinding = require('../defenses/DeviceBinding');
const RateLimiting = require('../defenses/RateLimiting');
const AlertSystem = require('../defenses/AlertSystem');

const router = express.Router();

// WebAuthn Defense Simulation
router.post('/webauthn/register', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const result = await webauthn.registerDevice(req.user.id, req.body);
 
 res.json({
 message: 'WebAuthn device registered successfully',
 credentialId: result.credentialId,
 publicKey: result.publicKey,
 deviceInfo: result.deviceInfo
 });
 } catch (error) {
 console.error('WebAuthn registration error:', error);
 res.status(500).json({ error: 'Failed to register WebAuthn device' });
 }
});

router.post('/webauthn/authenticate', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const result = await webauthn.authenticateDevice(req.user.id, req.body);
 
 res.json({
 verified: result.verified,
 deviceId: result.deviceId,
 challenge: result.challenge,
 timestamp: result.timestamp
 });
 } catch (error) {
 res.status(400).json({ error: 'WebAuthn authentication failed' });
 }
});

router.get('/webauthn/devices', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const devices = await webauthn.getUserDevices(req.user.id);
 res.json(devices);
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch WebAuthn devices' });
 }
});

// Device Binding Defense
router.post('/device-binding/trust', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 const result = await deviceBinding.trustDevice(req.user.id, {
 fingerprint: req.body.fingerprint,
 userAgent: req.get('User-Agent'),
 ipAddress: req.ip,
 deviceName: req.body.deviceName
 });
 
 res.json({
 message: 'Device trusted successfully',
 deviceId: result.deviceId,
 trustLevel: result.trustLevel
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to trust device' });
 }
});

router.get('/device-binding/status', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 const status = await deviceBinding.checkDeviceStatus(req.user.id, {
 fingerprint: req.body.fingerprint || 'current-device',
 userAgent: req.get('User-Agent'),
 ipAddress: req.ip
 });
 
 res.json(status);
 } catch (error) {
 res.status(500).json({ error: 'Failed to check device status' });
 }
});

router.get('/device-binding/devices', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 const devices = await deviceBinding.getTrustedDevices(req.user.id);
 res.json(devices);
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch trusted devices' });
 }
});

router.delete('/device-binding/devices/:deviceId', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 await deviceBinding.revokeDevice(req.user.id, req.params.deviceId);
 res.json({ message: 'Device revoked successfully' });
 } catch (error) {
 res.status(500).json({ error: 'Failed to revoke device' });
 }
});

// Rate Limiting Defense
router.get('/rate-limiting/status', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 const status = await rateLimiting.getStatus(req.ip, req.user.id);
 res.json(status);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get rate limiting status' });
 }
});

router.post('/rate-limiting/configure', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 const result = await rateLimiting.configure(req.body);
 res.json({
 message: 'Rate limiting configuration updated',
 settings: result
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to configure rate limiting' });
 }
});

router.post('/rate-limiting/test', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 const result = await rateLimiting.testLimits(req.ip, req.user.id, req.body.action);
 res.json(result);
 } catch (error) {
 res.status(429).json({ error: 'Rate limit exceeded' });
 }
});

// Alert System
router.post('/alerts/configure', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const result = await alertSystem.configureAlerts(req.user.id, req.body);
 res.json({
 message: 'Alert configuration updated',
 settings: result
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to configure alerts' });
 }
});

router.get('/alerts/recent', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const alerts = await alertSystem.getRecentAlerts(req.user.id, req.query.limit);
 res.json(alerts);
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch alerts' });
 }
});

router.post('/alerts/test', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const result = await alertSystem.triggerTestAlert(req.user.id, req.body.alertType);
 res.json({
 message: 'Test alert triggered',
 alert: result
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to trigger test alert' });
 }
});

// Defense Status Overview
router.get('/status', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const deviceBinding = new DeviceBinding();
 const rateLimiting = new RateLimiting();
 const alertSystem = new AlertSystem();

 const [
 webauthnDevices,
 trustedDevices,
 rateLimitStatus,
 recentAlerts
 ] = await Promise.all([
 webauthn.getUserDevices(req.user.id),
 deviceBinding.getTrustedDevices(req.user.id),
 rateLimiting.getStatus(req.ip, req.user.id),
 alertSystem.getRecentAlerts(req.user.id, 5)
 ]);

 res.json({
 webauthn: {
 enabled: webauthnDevices.length > 0,
 device_count: webauthnDevices.length,
 devices: webauthnDevices
 },
 device_binding: {
 enabled: trustedDevices.length > 0,
 trusted_devices: trustedDevices.length,
 current_device_trusted: trustedDevices.some(d => d.ip_address === req.ip)
 },
 rate_limiting: rateLimitStatus,
 alerts: {
 recent_count: recentAlerts.length,
 latest_alerts: recentAlerts
 }
 });
 } catch (error) {
 console.error('Defense status error:', error);
 res.status(500).json({ error: 'Failed to fetch defense status', details: error.message });
 }
});

// Defense Testing & Simulation
router.post('/test/attack-defense', authMiddleware, async (req, res) => {
 try {
 const { attackType, attackParams } = req.body;
 
 // Simulate an attack and test defense responses
 const results = {
 attack_type: attackType,
 defense_results: [],
 overall_protection: 'unknown'
 };

 switch (attackType) {
 case 'brute_force':
 const rateLimiting = new RateLimiting();
 const rateResult = await rateLimiting.simulateAttack(req.ip, 'login', attackParams);
 results.defense_results.push(rateResult);
 break;

 case 'device_spoofing':
 const deviceBinding = new DeviceBinding();
 const deviceResult = await deviceBinding.simulateAttack(req.user.id, attackParams);
 results.defense_results.push(deviceResult);
 break;

 case 'phishing_webauthn':
 const webauthn = new WebAuthnDefense();
 const webauthnResult = await webauthn.simulatePhishingResistance(attackParams);
 results.defense_results.push(webauthnResult);
 break;

 default:
 return res.status(400).json({ error: 'Unknown attack type' });
 }

 // Calculate overall protection level
 const successfulDefenses = results.defense_results.filter(r => r.blocked).length;
 const totalDefenses = results.defense_results.length;
 
 if (successfulDefenses === totalDefenses) {
 results.overall_protection = 'excellent';
 } else if (successfulDefenses > totalDefenses / 2) {
 results.overall_protection = 'good';
 } else {
 results.overall_protection = 'poor';
 }

 res.json(results);
 } catch (error) {
 res.status(500).json({ error: 'Failed to test attack defense' });
 }
});

// Health check
router.get('/health', (req, res) => {
 res.json({ 
 message: 'Defense mechanisms module loaded',
 available_defenses: ['webauthn', 'device-binding', 'rate-limiting', 'alerts'],
 status: 'ready'
 });
});

// Defense Status Overview
router.get('/status', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const deviceBinding = new DeviceBinding();
 const rateLimiting = new RateLimiting();
 const alertSystem = new AlertSystem();

 const webauthnDevices = await webauthn.getUserDevices(req.user.id);
 const trustedDevices = await deviceBinding.getTrustedDevices(req.user.id);

 res.json({
 webauthn: webauthnDevices.length > 0,
 deviceBinding: trustedDevices.length > 0,
 rateLimiting: true, // Always active
 alertSystem: true // Always active
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch defense status' });
 }
});

// Defense Logs
router.get('/logs', authMiddleware, async (req, res) => {
 try {
 const database = require('../models/database');
 const db = database.getDB();

 db.all(
 `SELECT * FROM defense_logs 
 WHERE user_id = ? OR user_id IS NULL 
 ORDER BY created_at DESC 
 LIMIT 50`,
 [req.user.id],
 (err, rows) => {
 if (err) {
 console.error('Defense logs query error:', err);
 res.status(500).json({ error: 'Failed to fetch defense logs' });
 } else {
 res.json({ logs: rows || [] });
 }
 }
 );
 } catch (error) {
 res.status(500).json({ error: 'Failed to fetch defense logs' });
 }
});

// Device Binding - Bind Device (matches frontend call)
router.post('/device-binding/bind', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 const result = await deviceBinding.trustDevice(req.user.id, {
 fingerprint: req.body.deviceInfo.userAgent + req.body.deviceInfo.platform,
 userAgent: req.body.deviceInfo.userAgent,
 ipAddress: req.ip,
 deviceName: req.body.deviceName || 'Unnamed Device',
 platform: req.body.deviceInfo.platform,
 language: req.body.deviceInfo.language,
 screenResolution: req.body.deviceInfo.screenResolution
 });
 
 res.json({
 message: 'Device bound successfully',
 deviceId: result.deviceId,
 trustLevel: result.trustLevel
 });
 } catch (error) {
 console.error('Device binding error:', error);
 res.status(500).json({ error: 'Failed to bind device' });
 }
});

// Rate Limiting Configuration
router.post('/rate-limiting/config', authMiddleware, async (req, res) => {
 try {
 const { maxAttempts, windowMinutes, enabled } = req.body;
 
 // In a real implementation, you'd store this in database
 // For simulation, we'll just acknowledge the configuration
 console.log('Rate limiting config updated:', { maxAttempts, windowMinutes, enabled });
 
 res.json({
 message: 'Rate limiting configuration updated successfully',
 config: { maxAttempts, windowMinutes, enabled }
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to update rate limiting configuration' });
 }
});

// Alert System Configuration
router.post('/alert-system/config', authMiddleware, async (req, res) => {
 try {
 const { emailAlerts, smsAlerts, threshold, enabled } = req.body;
 
 // In a real implementation, you'd store this in database
 console.log('Alert system config updated:', { emailAlerts, smsAlerts, threshold, enabled });
 
 res.json({
 message: 'Alert system configuration updated successfully',
 config: { emailAlerts, smsAlerts, threshold, enabled }
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to update alert system configuration' });
 }
});

// Defense Testing Endpoints
router.post('/webauthn/test', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 await webauthn.simulateTest(req.user.id);
 
 res.json({
 message: 'WebAuthn defense test completed successfully',
 testResult: 'Device authentication simulation passed'
 });
 } catch (error) {
 res.status(500).json({ error: 'WebAuthn test failed' });
 }
});

router.post('/device-binding/test', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 await deviceBinding.simulateTest(req.user.id);
 
 res.json({
 message: 'Device binding test completed successfully',
 testResult: 'Device trust verification passed'
 });
 } catch (error) {
 res.status(500).json({ error: 'Device binding test failed' });
 }
});

router.post('/rate-limiting/test', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 await rateLimiting.simulateTest(req.user.id);
 
 res.json({
 message: 'Rate limiting test completed successfully',
 testResult: 'Rate limiting simulation passed'
 });
 } catch (error) {
 res.status(500).json({ error: 'Rate limiting test failed' });
 }
});

router.post('/alert-system/test', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 await alertSystem.simulateTest(req.user.id);
 
 res.json({
 message: 'Alert system test completed successfully',
 testResult: 'Alert simulation triggered successfully'
 });
 } catch (error) {
 res.status(500).json({ error: 'Alert system test failed' });
 }
});

// Additional WebAuthn endpoints
router.get('/webauthn/options/registration', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const options = await webauthn.createCredentialOptions(
 req.user.id, 
 req.user.username, 
 req.user.email
 );
 res.json(options);
 } catch (error) {
 res.status(500).json({ error: 'Failed to create registration options' });
 }
});

router.get('/webauthn/options/authentication', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const options = await webauthn.getAssertionOptions(req.user.id);
 res.json(options);
 } catch (error) {
 res.status(500).json({ error: 'Failed to create authentication options' });
 }
});

router.delete('/webauthn/devices/:deviceId', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const result = await webauthn.revokeDevice(req.user.id, req.params.deviceId);
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to revoke WebAuthn device' });
 }
});

// Enhanced Device Binding endpoints
router.get('/device-binding/security-status', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 const status = await deviceBinding.getDeviceSecurityStatus(req.user.id);
 res.json(status);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get device security status' });
 }
});

router.delete('/device-binding/devices/:deviceId', authMiddleware, async (req, res) => {
 try {
 const deviceBinding = new DeviceBinding();
 const result = await deviceBinding.revokeDevice(req.user.id, req.params.deviceId);
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to revoke device' });
 }
});

// Enhanced Rate Limiting endpoints
router.get('/rate-limiting/config', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 const config = await rateLimiting.getCurrentConfiguration();
 res.json(config);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get rate limiting configuration' });
 }
});

router.get('/rate-limiting/active', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 const activeLimits = await rateLimiting.getActiveRateLimits();
 res.json(activeLimits);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get active rate limits' });
 }
});

router.delete('/rate-limiting/clear/:identifier', authMiddleware, async (req, res) => {
 try {
 const rateLimiting = new RateLimiting();
 const result = await rateLimiting.clearRateLimit(req.params.identifier);
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to clear rate limit' });
 }
});

// Enhanced Alert System endpoints
router.get('/alert-system/config', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const config = await alertSystem.getCurrentConfiguration();
 res.json(config);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get alert system configuration' });
 }
});

router.get('/alert-system/alerts', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const limit = parseInt(req.query.limit) || 50;
 const alerts = await alertSystem.getRecentAlerts(req.user.id, limit);
 res.json(alerts);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get recent alerts' });
 }
});

router.post('/alert-system/alerts/:alertId/acknowledge', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const result = await alertSystem.acknowledgeAlert(req.params.alertId, req.user.id);
 res.json(result);
 } catch (error) {
 res.status(500).json({ error: 'Failed to acknowledge alert' });
 }
});

router.get('/alert-system/metrics', authMiddleware, async (req, res) => {
 try {
 const alertSystem = new AlertSystem();
 const timeRange = req.query.timeRange || '24h';
 const metrics = await alertSystem.getAlertMetrics(timeRange);
 res.json(metrics);
 } catch (error) {
 res.status(500).json({ error: 'Failed to get alert metrics' });
 }
});

// Defense Analytics endpoint
router.get('/analytics', authMiddleware, async (req, res) => {
 try {
 const webauthn = new WebAuthnDefense();
 const deviceBinding = new DeviceBinding();
 const rateLimiting = new RateLimiting();
 const alertSystem = new AlertSystem();

 const [
 webauthnStats,
 deviceStats,
 rateLimitStats,
 alertMetrics
 ] = await Promise.all([
 webauthn.getWebAuthnStatistics().catch(() => ({})),
 deviceBinding.getDeviceSecurityStatus(req.user.id).catch(() => ({})),
 rateLimiting.getActiveRateLimits().catch(() => []),
 alertSystem.getAlertMetrics().catch(() => ({}))
 ]);

 res.json({
 webauthn: webauthnStats,
 deviceBinding: deviceStats,
 rateLimiting: {
 activeLimits: rateLimitStats.length,
 limits: rateLimitStats
 },
 alerts: alertMetrics,
 overallSecurity: {
 webauthnEnabled: webauthnStats.total_devices > 0,
 trustedDevices: deviceStats.trusted_devices || 0,
 activeRateLimits: rateLimitStats.length,
 recentAlerts: alertMetrics.totalAlerts || 0
 }
 });
 } catch (error) {
 res.status(500).json({ error: 'Failed to get defense analytics' });
 }
});

module.exports = router;