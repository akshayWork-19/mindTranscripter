const Groq = require('groq-sdk');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Groq Service to handle all AI interactions.
 */
class GroqService {
  constructor(apiKey) {
    this.groq = new Groq({ apiKey: apiKey || process.env.GROQ_API_KEY });
  }

  /**
   * Transcribe audio file using Whisper Large V3
   */
  async transcribe(filePath) {
    try {
      const transcription = await this.groq.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-large-v3',
        response_format: 'json',
        language: 'en',
      });
      return transcription.text;
    } catch (error) {
      logger.error('Groq Transcription Error', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Generate suggestions based on transcript context
   */
  async getSuggestions(transcript, promptTemplate, model = 'llama-3.3-70b-versatile') {
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: promptTemplate || 'You are an AI meeting assistant. Based on the recent transcript, provide 3 short, actionable suggestions. Format as JSON array of objects: [{ "title": "...", "preview": "...", "type": "..." }]. Types: "question", "fact-check", "talking-point", "clarification".'
          },
          {
            role: 'user',
            content: `Recent Transcript: ${transcript}`
          }
        ],
        model: model,
        response_format: { type: 'json_object' }
      });

      const content = JSON.parse(completion.choices[0].message.content);
      return content.suggestions || content;
    } catch (error) {
      logger.error('Groq Suggestions Error', { message: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get detailed answer or chat response (streaming supported)
   */
  async getChatResponseStream(context, userInput, promptTemplate, model = 'llama-3.3-70b-versatile') {
    try {
      return await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: promptTemplate || 'You are an AI meeting copilot. Provide detailed, helpful answers based on the transcript context.'
          },
          {
            role: 'user',
            content: `Context: ${context}\n\nUser Question/Suggestion: ${userInput}`
          }
        ],
        model: model,
        stream: true,
      });
    } catch (error) {
      logger.error('Groq Streaming Error', { message: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = GroqService;
