const express = require('express');
const router = express.Router();
const GroqService = require('../services/groqServices');
const logger = require('../utils/logger');

router.post('/generate', async (req, res) => {
  try {
    const { transcript, prompt, model } = req.body;
    const apiKey = req.headers['x-api-key'];

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript context is required' });
    }

    const groqService = new GroqService(apiKey);
    const suggestions = await groqService.getSuggestions(transcript, prompt, model);

    res.json({ suggestions });
  } catch (error) {
    logger.error('Suggestions Route Error', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { context, userInput, prompt, model } = req.body;
    const apiKey = req.headers['x-api-key'];

    const groqService = new GroqService(apiKey);
    const stream = await groqService.getChatResponseStream(context, userInput, prompt, model);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    logger.error('Chat Route Error', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to stream chat response' });
  }
});

module.exports = router;
