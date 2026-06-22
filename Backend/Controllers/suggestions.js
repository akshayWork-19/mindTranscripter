const GroqService = require('../services/groqServices');
const logger = require('../utils/logger');
const fs = require('fs');


const generateSuggestions = async (req, res) => {
    try {
        const { transcript, prompt, model } = req.body;
        const apiKey = req.headers['x-api-key'];

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript context is required' });
        }

        if (!apiKey && !process.env.GROQ_API_KEY) {
            return res.status(401).json({ error: 'No Groq API key found.' });
        }

        const groqService = new GroqService(apiKey);
        const suggestions = await groqService.getSuggestions(transcript, prompt, model);

        res.json({ suggestions });
    } catch (error) {
        logger.error('Suggestions Route Error', { message: error.message });
        res.status(error.status || 500).json({
            error: error.message || 'Failed to generate suggestions.'
        });
    }
}


const chatResponse = async (req, res) => {
    try {
        const { context, userInput, prompt, model } = req.body;
        const apiKey = req.headers['x-api-key'];

        if (!userInput) return res.status(400).json({ error: 'User input is required.' });
        if (!apiKey && !process.env.GROQ_API_KEY) return res.status(401).json({ error: 'No API key found.' });

        const groqService = new GroqService(apiKey);
        const stream = await groqService.getChatResponseStream(context, userInput, prompt, model);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        try {
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
            }
            res.write('data: [DONE]\n\n');
            res.end();
        } catch (streamError) {
            // can't change status, already 200 — signal through stream
            res.write(`data: ${JSON.stringify({ error: 'Stream interrupted.' })}\n\n`);
            res.end();
        }
    } catch (error) {
        logger.error('Chat Route Error', { message: error.message });
        res.status(error.status || 500).json({
            error: error.message || 'Failed to stream chat response.'
        });
    }
}


const transcribe = async (req, res) => {
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
            // fs.unlinkSync(req.file.path); blocking can cause issue in production
            await fs.promises.unlink(req.file.path);
        }
        res.status(error.status || 500).json({ error: error.message || 'failed to transcribe audi' });
    }
}

module.exports = {
    generateSuggestions,
    chatResponse,
    transcribe
}