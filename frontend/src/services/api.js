import axios from 'axios';
import { config } from '@/config/env';
const API_BASE_URL = config.apiBaseUrl;

const getHeaders = () => {
  const apiKey = localStorage.getItem('groq_api_key') || '';
  return {
    'x-api-key': apiKey
  };
};

export const api = {
  transcribe: async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      const response = await axios.post(`${API_BASE_URL}/whisper/transcribe`, formData, {
        headers: {
          ...getHeaders(),
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // Whisper needs longer timeout
      });
      return response.data;
    } catch (error) {
      if (!error.response) return { error: 'Connection failed. Check your network.' };
      if (error.response.status === 401) return { error: 'Invalid API key.' };
      if (error.response.status === 429) return { error: 'Rate limit hit. Try again shortly.' };
      if (error.code === 'ECONNABORTED') return { error: 'Transcription timed out.' };
      return { error: 'Transcription failed.' };
    }
  },

  generateSuggestions: async (transcript, prompt, model) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/suggestions/generate`, {
        transcript,
        prompt,
        model
      }, {
        headers: getHeaders()
      });
      return response.data;
    } catch (error) {
      if (!error.response) return { error: 'Connection failed. Check your network.' };
      if (error.response.status === 401) return { error: 'Invalid API key.' };
      if (error.response.status === 429) return { error: 'Rate limit hit. Try again shortly.' };
      if (error.code === 'ECONNABORTED') return { error: 'Suggestions generation timed out.' };
      return { error: 'Suggestions generation failed.' };
    }
  },

  streamChatResponse: async (context, userInput, prompt, model, onChunk) => {
    try {
      const response = await fetch(`${API_BASE_URL}/suggestions/chat`, {
        method: 'POST',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ context, userInput, prompt, model })
      });


      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw { status: response.status, message: err.error || 'Failed to start stream.' };
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const { content, error } = JSON.parse(data); // destructure both
              if (error) throw { status: 500, message: error }; // stream sent an error signal
              if (content) onChunk(content);
            } catch (e) {
              if (e.status) throw e; // re-throw your clean error upward
              console.error('Error parsing stream chunk', e);
            }
          }
        }
      }
    } catch (error) {
      if (error.status) throw error; // re-throw clean errors
      throw { status: 500, message: 'Stream connection failed.' };
    }
  }
};
