const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const path = require('path');
const whisperRoutes = require('./routes/whisper');
const suggestionRoutes = require('./routes/suggestions');
const config = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');


dotenv.config();
const PORT = config.PORT;
const app = express();

// Middleware
const rawOrigins = config.ALLOWED_ORIGIN || 'http://localhost:5173';
// Support multiple comma-separated origins, stripping trailing slashes
const allowedOrigins = rawOrigins.split(',').map(o => o.trim().replace(/\/$/, ''));

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Check if origin is allowed or if wildcard '*' is used
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    } else {
      return callback(new Error('CORS Policy: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Static files (Landing Page)
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiLimiter);
// Routes
app.use('/api/whisper', whisperRoutes);
app.use('/api/suggestions', suggestionRoutes);

// API Info Route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the TwinMind API',
    version: '1.0.0',
    endpoints: {
      healthCheck: 'GET /health',
      transcribeAudio: 'POST /api/whisper/transcribe',
      generateSuggestions: 'POST /api/suggestions/generate',
      chatStream: 'POST /api/suggestions/chat'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => {
  logger.info(`🚀 TwinMind Backend running on port ${PORT}`);
  logger.info(`🌐 Allowing CORS from: ${process.env.ALLOWED_ORIGIN || 'http://localhost:5173'}`);
});
