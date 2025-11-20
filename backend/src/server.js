const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize database first
const database = require('./models/database');

const authRoutes = require('./routes/auth');
const twoFARoutes = require('./routes/twofa');
const attackRoutes = require('./routes/attacks');
const defenseRoutes = require('./routes/defenses');
const dashboardRoutes = require('./routes/dashboard');
const evidenceRoutes = require('./routes/evidence');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy - trust first hop (nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
 origin: process.env.FRONTEND_URL || 'http://localhost:3000',
 credentials: true
}));

// Rate limiting
const limiter = rateLimit({
 windowMs: 15 * 60 * 1000, // 15 minutes
 max: 100, // limit each IP to 100 requests per windowMs
 message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/2fa', twoFARoutes);
app.use('/api/attacks', attackRoutes);
app.use('/api/defenses', defenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attacks', evidenceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
 res.json({ 
 status: 'OK', 
 message: '2FA Cyber Attacks Lab API is running',
 timestamp: new Date().toISOString()
 });
});

// Error handling middleware
app.use((err, req, res, next) => {
 console.error(err.stack);
 res.status(500).json({ 
 error: 'Something went wrong!', 
 message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
 });
});

// 404 handler
app.use('*', (req, res) => {
 res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
 console.log(` 2FA Cyber Attacks Lab server running on port ${PORT}`);
 console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
 console.log(` Security headers enabled`);
 console.log(` Educational purposes only - attacks are simulated`);
});

module.exports = app;