const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const whisperRoutes = require('./routes/whisper');
const suggestionRoutes = require('./routes/suggestions');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/whisper', whisperRoutes);
app.use('/api/suggestions', suggestionRoutes);

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
