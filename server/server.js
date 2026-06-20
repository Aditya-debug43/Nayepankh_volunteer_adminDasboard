require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// Render (and most PaaS) sit behind a TLS-terminating proxy. Trusting it lets Express
// see the original HTTPS protocol (so Secure cookies are honoured) and the real client
// IP (so express-rate-limit keys per user, not per proxy).
app.set('trust proxy', 1);

// --- Core middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

// --- Health check ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'nayepankh-volunteer-api' }));

// --- Routes ---
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/volunteers', require('./routes/volunteer.routes'));
app.use('/api/events', require('./routes/event.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/reports', require('./routes/report.routes'));

// --- Error handling ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => logger.info(`NayePankh API running on port ${PORT}`));
});

module.exports = app;
