const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const GroqService = require('../services/groqServices');
const logger = require('../utils/logger');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `audio-${Date.now()}.webm`);
  }
});

const upload = multer({ storage });

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  logger.info('🎙️ Transcription request received');
  try {
    if (!req.file) {
      logger.error('❌ No audio file in request');
      return res.status(400).json({ error: 'No audio file uploaded' });
    }

    logger.info(`📁 File received: ${req.file.originalname} (${req.file.size} bytes)`);

    const apiKey = req.headers['x-api-key'];
    if (!apiKey && !process.env.GROQ_API_KEY) {
      logger.error('❌ No API key provided');
      return res.status(401).json({ error: 'No Groq API key found. Please set it in Settings.' });
    }

    const groqService = new GroqService(apiKey);
    const transcript = await groqService.transcribe(req.file.path);

    logger.info('✅ Transcription successful', { length: transcript.length });

    // Clean up file after transcription
    fs.unlinkSync(req.file.path);

    res.json({ transcript });
  } catch (error) {
    logger.error('❌ Transcription Route Error', { message: error.message, stack: error.stack });
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: `Failed to transcribe audio: ${error.message}` });
  }
});

module.exports = router;
