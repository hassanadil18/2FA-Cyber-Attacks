const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const database = require('../models/database');

const router = express.Router();

// Get dashboard overview statistics
router.get('/stats', authMiddleware, (req, res) => {
 const queries = {
 totalUsers: 'SELECT COUNT(*) as count FROM users',
 activeUsers: 'SELECT COUNT(*) as count FROM users WHERE is_2fa_enabled = 1',
 recentLogins: 'SELECT COUNT(*) as count FROM login_attempts WHERE created_at > datetime("now", "-24 hours")',
 successfulLogins: 'SELECT COUNT(*) as count FROM login_attempts WHERE success = 1 AND created_at > datetime("now", "-24 hours")',
 failedLogins: 'SELECT COUNT(*) as count FROM login_attempts WHERE success = 0 AND created_at > datetime("now", "-24 hours")',
 attackAttempts: 'SELECT COUNT(*) as count FROM attack_logs WHERE created_at > datetime("now", "-24 hours")',
 defenseActivations: 'SELECT COUNT(*) as count FROM defense_logs WHERE created_at > datetime("now", "-24 hours")'
 };

 const results = {};
 let completed = 0;
 const total = Object.keys(queries).length;

 Object.entries(queries).forEach(([key, query]) => {
 database.getDB().get(query, [], (err, row) => {
 if (err) {
 console.error(`Error in ${key} query:`, err);
 results[key] = 0;
 } else {
 results[key] = row.count;
 }
 
 completed++;
 if (completed === total) {
 res.json(results);
 }
 });
 });
});

// Get recent login attempts
router.get('/login-attempts', authMiddleware, (req, res) => {
 const limit = parseInt(req.query.limit) || 50;
 const query = `
 SELECT * FROM login_attempts 
 ORDER BY created_at DESC 
 LIMIT ?
 `;

 database.getDB().all(query, [limit], (err, rows) => {
 if (err) {
 console.error('Error fetching login attempts:', err);
 return res.status(500).json({ error: 'Failed to fetch login attempts' });
 }
 res.json(rows);
 });
});

// Get attack logs
router.get('/attacks', authMiddleware, (req, res) => {
 const limit = parseInt(req.query.limit) || 50;
 const query = `
 SELECT 
 al.*,
 u.username 
 FROM attack_logs al
 LEFT JOIN users u ON al.target_user_id = u.id
 ORDER BY al.created_at DESC 
 LIMIT ?
 `;

 database.getDB().all(query, [limit], (err, rows) => {
 if (err) {
 console.error('Error fetching attack logs:', err);
 return res.status(500).json({ error: 'Failed to fetch attack logs' });
 }
 res.json(rows);
 });
});

// Get defense logs
router.get('/defenses', authMiddleware, (req, res) => {
 const limit = parseInt(req.query.limit) || 50;
 const query = `
 SELECT 
 dl.*,
 u.username 
 FROM defense_logs dl
 LEFT JOIN users u ON dl.user_id = u.id
 ORDER BY dl.created_at DESC 
 LIMIT ?
 `;

 database.getDB().all(query, [limit], (err, rows) => {
 if (err) {
 console.error('Error fetching defense logs:', err);
 return res.status(500).json({ error: 'Failed to fetch defense logs' });
 }
 res.json(rows);
 });
});

// Get security events
router.get('/security-events', authMiddleware, (req, res) => {
 const limit = parseInt(req.query.limit) || 50;
 const query = `
 SELECT 
 se.*,
 u.username 
 FROM security_events se
 LEFT JOIN users u ON se.user_id = u.id
 ORDER BY se.created_at DESC 
 LIMIT ?
 `;

 database.getDB().all(query, [limit], (err, rows) => {
 if (err) {
 console.error('Error fetching security events:', err);
 return res.status(500).json({ error: 'Failed to fetch security events' });
 }
 res.json(rows);
 });
});

// Get attack analytics with trending data
router.get('/analytics/attacks', authMiddleware, (req, res) => {
 const timeframe = req.query.timeframe || '24h'; // 24h, 7d, 30d
 
 let timeCondition;
 switch(timeframe) {
 case '7d':
 timeCondition = 'datetime("now", "-7 days")';
 break;
 case '30d':
 timeCondition = 'datetime("now", "-30 days")';
 break;
 default:
 timeCondition = 'datetime("now", "-24 hours")';
 }

 const analyticsQueries = {
 attacksByType: `
 SELECT 
 attack_type,
 COUNT(*) as count,
 AVG(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_rate
 FROM attack_logs 
 WHERE created_at > ${timeCondition}
 GROUP BY attack_type
 ORDER BY count DESC
 `,
 attacksByHour: `
 SELECT 
 strftime('%H', created_at) as hour,
 COUNT(*) as count
 FROM attack_logs 
 WHERE created_at > ${timeCondition}
 GROUP BY hour
 ORDER BY hour
 `,
 topTargets: `
 SELECT 
 u.username,
 COUNT(*) as attack_count,
 MAX(al.created_at) as last_attack
 FROM attack_logs al
 JOIN users u ON al.target_user_id = u.id
 WHERE al.created_at > ${timeCondition}
 GROUP BY al.target_user_id
 ORDER BY attack_count DESC
 LIMIT 10
 `,
 attackEffectiveness: `
 SELECT 
 defense_triggered,
 COUNT(*) as total_attacks,
 SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_attacks
 FROM attack_logs 
 WHERE created_at > ${timeCondition}
 GROUP BY defense_triggered
 `
 };

 const results = {};
 let completed = 0;
 const total = Object.keys(analyticsQueries).length;

 Object.entries(analyticsQueries).forEach(([key, query]) => {
 database.getDB().all(query, [], (err, rows) => {
 if (err) {
 console.error(`Error in ${key} analytics query:`, err);
 results[key] = [];
 } else {
 results[key] = rows;
 }
 
 completed++;
 if (completed === total) {
 res.json({
 timeframe,
 timestamp: new Date().toISOString(),
 ...results
 });
 }
 });
 });
});

// Get defense analytics with effectiveness metrics
router.get('/analytics/defenses', authMiddleware, (req, res) => {
 const timeframe = req.query.timeframe || '24h';
 
 let timeCondition;
 switch(timeframe) {
 case '7d':
 timeCondition = 'datetime("now", "-7 days")';
 break;
 case '30d':
 timeCondition = 'datetime("now", "-30 days")';
 break;
 default:
 timeCondition = 'datetime("now", "-24 hours")';
 }

 const defenseQueries = {
 defensesByType: `
 SELECT 
 defense_type,
 COUNT(*) as activations,
 effectiveness
 FROM defense_logs 
 WHERE created_at > ${timeCondition}
 GROUP BY defense_type, effectiveness
 ORDER BY activations DESC
 `,
 defenseEffectiveness: `
 SELECT 
 defense_type,
 COUNT(*) as total_activations,
 SUM(CASE WHEN effectiveness IN ('blocked', 'protected', 'prevented') THEN 1 ELSE 0 END) as successful_blocks
 FROM defense_logs 
 WHERE created_at > ${timeCondition}
 GROUP BY defense_type
 `,
 defenseTrends: `
 SELECT 
 DATE(created_at) as date,
 defense_type,
 COUNT(*) as activations
 FROM defense_logs 
 WHERE created_at > ${timeCondition}
 GROUP BY DATE(created_at), defense_type
 ORDER BY date DESC
 `,
 riskScores: `
 SELECT 
 identifier,
 COUNT(*) as risk_events,
 MAX(created_at) as last_event
 FROM security_events 
 WHERE created_at > ${timeCondition}
 GROUP BY identifier
 ORDER BY risk_events DESC
 LIMIT 20
 `
 };

 const results = {};
 let completed = 0;
 const total = Object.keys(defenseQueries).length;

 Object.entries(defenseQueries).forEach(([key, query]) => {
 database.getDB().all(query, [], (err, rows) => {
 if (err) {
 console.error(`Error in ${key} defense analytics:`, err);
 results[key] = [];
 } else {
 results[key] = rows;
 }
 
 completed++;
 if (completed === total) {
 res.json({
 timeframe,
 timestamp: new Date().toISOString(),
 ...results
 });
 }
 });
 });
});

// Get real-time system health metrics
router.get('/health', authMiddleware, (req, res) => {
 const healthChecks = {
 database: 'SELECT 1 as status',
 activeUsers: 'SELECT COUNT(*) as count FROM users WHERE last_login > datetime("now", "-1 hour")',
 systemLoad: `
 SELECT 
 COUNT(CASE WHEN created_at > datetime("now", "-5 minutes") THEN 1 END) as recent_events,
 COUNT(CASE WHEN created_at > datetime("now", "-1 hour") THEN 1 END) as hourly_events
 FROM login_attempts
 `,
 alertCount: 'SELECT COUNT(*) as count FROM security_events WHERE event_type = "security_alert" AND expires_at > datetime("now")'
 };

 const results = {
 status: 'healthy',
 timestamp: new Date().toISOString(),
 uptime: process.uptime(),
 memory: process.memoryUsage()
 };
 
 let completed = 0;
 const total = Object.keys(healthChecks).length;

 Object.entries(healthChecks).forEach(([key, query]) => {
 database.getDB().get(query, [], (err, row) => {
 if (err) {
 console.error(`Error in ${key} health check:`, err);
 results[key] = { status: 'error', error: err.message };
 results.status = 'degraded';
 } else {
 results[key] = { status: 'ok', data: row };
 }
 
 completed++;
 if (completed === total) {
 res.json(results);
 }
 });
 });
});

// Get live activity feed
router.get('/activity/live', authMiddleware, (req, res) => {
 const limit = parseInt(req.query.limit) || 20;
 const query = `
 SELECT 
 'login' as activity_type,
 'Login attempt' as activity,
 identifier as details,
 success,
 timestamp as created_at
 FROM login_attempts
 WHERE timestamp > datetime('now', '-1 hour')
 
 UNION ALL
 
 SELECT 
 'attack' as activity_type,
 attack_type || ' attack' as activity,
 attack_details as details,
 success,
 created_at
 FROM attack_logs
 WHERE created_at > datetime('now', '-1 hour')
 
 UNION ALL
 
 SELECT 
 'defense' as activity_type,
 defense_type || ' defense' as activity,
 action_taken as details,
 CASE WHEN effectiveness IN ('blocked', 'protected') THEN 1 ELSE 0 END as success,
 created_at
 FROM defense_logs
 WHERE created_at > datetime('now', '-1 hour')
 
 ORDER BY created_at DESC
 LIMIT ?
 `;

 database.getDB().all(query, [limit], (err, rows) => {
 if (err) {
 console.error('Error fetching live activity:', err);
 return res.status(500).json({ error: 'Failed to fetch live activity' });
 }
 
 res.json({
 timestamp: new Date().toISOString(),
 activities: rows,
 total: rows.length
 });
 });
});

// Get threat intelligence summary
router.get('/threat-intelligence', authMiddleware, (req, res) => {
 const intelligenceQueries = {
 suspiciousIPs: `
 SELECT 
 ip_address,
 COUNT(*) as failed_attempts,
 MAX(timestamp) as last_attempt,
 COUNT(DISTINCT identifier) as unique_targets
 FROM login_attempts 
 WHERE success = 0 AND timestamp > datetime('now', '-24 hours')
 GROUP BY ip_address
 HAVING failed_attempts >= 3
 ORDER BY failed_attempts DESC
 LIMIT 10
 `,
 attackPatterns: `
 SELECT 
 attack_type,
 AVG(julianday('now') - julianday(created_at)) * 24 as avg_hours_since,
 COUNT(*) as frequency,
 MAX(created_at) as last_seen
 FROM attack_logs 
 WHERE created_at > datetime('now', '-7 days')
 GROUP BY attack_type
 ORDER BY frequency DESC
 `,
 compromisedAccounts: `
 SELECT 
 u.username,
 COUNT(al.id) as attack_count,
 COUNT(CASE WHEN al.success = 1 THEN 1 END) as successful_attacks,
 MAX(al.created_at) as last_attack
 FROM users u
 LEFT JOIN attack_logs al ON u.id = al.target_user_id
 WHERE al.created_at > datetime('now', '-24 hours')
 GROUP BY u.id
 HAVING successful_attacks > 0
 ORDER BY successful_attacks DESC
 `,
 defenseGaps: `
 SELECT 
 attack_type,
 COUNT(*) as undefended_attacks,
 ROUND(AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
 FROM attack_logs 
 WHERE defense_triggered = 0 AND created_at > datetime('now', '-24 hours')
 GROUP BY attack_type
 HAVING undefended_attacks > 0
 ORDER BY success_rate DESC
 `
 };

 const results = {};
 let completed = 0;
 const total = Object.keys(intelligenceQueries).length;

 Object.entries(intelligenceQueries).forEach(([key, query]) => {
 database.getDB().all(query, [], (err, rows) => {
 if (err) {
 console.error(`Error in ${key} threat intelligence:`, err);
 results[key] = [];
 } else {
 results[key] = rows;
 }
 
 completed++;
 if (completed === total) {
 // Calculate overall threat level
 const threatLevel = calculateThreatLevel(results);
 
 res.json({
 timestamp: new Date().toISOString(),
 threatLevel,
 intelligence: results
 });
 }
 });
 });
});

// Helper function to calculate threat level
function calculateThreatLevel(intelligence) {
 let score = 0;
 
 // Factor in suspicious IPs
 if (intelligence.suspiciousIPs && intelligence.suspiciousIPs.length > 5) score += 30;
 else if (intelligence.suspiciousIPs && intelligence.suspiciousIPs.length > 2) score += 15;
 
 // Factor in compromised accounts
 if (intelligence.compromisedAccounts && intelligence.compromisedAccounts.length > 0) score += 40;
 
 // Factor in defense gaps
 if (intelligence.defenseGaps && intelligence.defenseGaps.length > 2) score += 20;
 
 // Factor in attack frequency
 const totalAttacks = intelligence.attackPatterns ? 
 intelligence.attackPatterns.reduce((sum, pattern) => sum + pattern.frequency, 0) : 0;
 if (totalAttacks > 50) score += 25;
 else if (totalAttacks > 20) score += 15;
 
 if (score >= 70) return 'critical';
 if (score >= 50) return 'high';
 if (score >= 30) return 'medium';
 return 'low';
}

// Export system logs for analysis
router.get('/export/logs', authMiddleware, (req, res) => {
 const format = req.query.format || 'json'; // json, csv
 const type = req.query.type || 'all'; // all, attacks, defenses, logins
 const days = parseInt(req.query.days) || 7;
 
 let query;
 switch(type) {
 case 'attacks':
 query = `SELECT * FROM attack_logs WHERE created_at > datetime('now', '-${days} days')`;
 break;
 case 'defenses':
 query = `SELECT * FROM defense_logs WHERE created_at > datetime('now', '-${days} days')`;
 break;
 case 'logins':
 query = `SELECT * FROM login_attempts WHERE timestamp > datetime('now', '-${days} days')`;
 break;
 default:
 query = `
 SELECT 'attack' as log_type, attack_type as event_type, attack_details as details, created_at FROM attack_logs WHERE created_at > datetime('now', '-${days} days')
 UNION ALL
 SELECT 'defense' as log_type, defense_type as event_type, action_taken as details, created_at FROM defense_logs WHERE created_at > datetime('now', '-${days} days')
 UNION ALL
 SELECT 'login' as log_type, 'login_attempt' as event_type, identifier as details, datetime(timestamp/1000, 'unixepoch') as created_at FROM login_attempts WHERE timestamp > datetime('now', '-${days} days')
 ORDER BY created_at DESC
 `;
 }

 database.getDB().all(query, [], (err, rows) => {
 if (err) {
 console.error('Error exporting logs:', err);
 return res.status(500).json({ error: 'Failed to export logs' });
 }
 
 if (format === 'csv') {
 const csv = convertToCSV(rows);
 res.setHeader('Content-Type', 'text/csv');
 res.setHeader('Content-Disposition', `attachment; filename="security-logs-${type}-${days}days.csv"`);
 res.send(csv);
 } else {
 res.setHeader('Content-Type', 'application/json');
 res.setHeader('Content-Disposition', `attachment; filename="security-logs-${type}-${days}days.json"`);
 res.json({
 export_info: {
 type,
 days,
 timestamp: new Date().toISOString(),
 total_records: rows.length
 },
 data: rows
 });
 }
 });
});

// Helper function to convert data to CSV
function convertToCSV(data) {
 if (!data.length) return '';
 
 const headers = Object.keys(data[0]);
 const csvContent = [
 headers.join(','),
 ...data.map(row => 
 headers.map(field => {
 const value = row[field];
 return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
 }).join(',')
 )
 ].join('\n');
 
 return csvContent;
}

module.exports = router;