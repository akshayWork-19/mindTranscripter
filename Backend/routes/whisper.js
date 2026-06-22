const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { transcribe } = require('../Controllers/suggestions');

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

router.post('/transcribe', upload.single('audio'), transcribe);

module.exports = router;
