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
      if (error.status === 429) throw { status: 429, message: "Rate limit reached. Try again shortly !" };
      if (error.status === 401) throw { status: 401, message: 'Invalid API key.' };
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') throw { status: 408, message: 'Transcription timed out.' };

      throw { status: 500, message: 'Transcription failed.' };
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
            content: `Recent Transcript:\n${transcript.join('\n')}`
          }
        ],
        model: model,
        response_format: { type: 'json_object' }
      });

      const content = JSON.parse(completion.choices[0].message.content);
      if (!content.suggestions || content.suggestions.length === 0) {
        throw { status: 500, message: 'Model returned unexpected format.' };
      }

      return content.suggestions;
    } catch (error) {
      logger.error('Groq Suggestions Error', { message: error.message });
      if (error.status === 429) throw { status: 429, message: 'Rate limit reached.' };
      if (error.status === 401) throw { status: 401, message: 'Invalid API key.' };
      throw { status: 500, message: 'Failed to generate suggestions.' };
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
      logger.error('Groq Streaming Error', { message: error.message });
      if (error.status === 429) throw { status: 429, message: 'Rate limit reached.' };
      if (error.status === 401) throw { status: 401, message: 'Invalid API key.' };
      throw { status: 500, message: 'Failed to start stream.' };
    }
  }
}

module.exports = GroqService;
