import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const apiKey = localStorage.getItem('groq_api_key') || '';
  return {
    'x-api-key': apiKey
  };
};

export const api = {
  transcribe: async (audioBlob) => {
    const formData = new FormData();
    // Add filename for better compatibility with multer/whisper
    formData.append('audio', audioBlob, 'audio.webm');

    const response = await axios.post(`${API_BASE_URL}/whisper/transcribe`, formData, {
      headers: {
        ...getHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  generateSuggestions: async (transcript, prompt, model) => {
    const response = await axios.post(`${API_BASE_URL}/suggestions/generate`, {
      transcript,
      prompt,
      model
    }, {
      headers: getHeaders()
    });
    return response.data;
  },

  streamChatResponse: async (context, userInput, prompt, model, onChunk) => {
    const response = await fetch(`${API_BASE_URL}/suggestions/chat`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ context, userInput, prompt, model })
    });

    if (!response.ok) throw new Error('Failed to start stream');

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
            const { content } = JSON.parse(data);
            if (content) onChunk(content);
          } catch (e) {
            console.error('Error parsing stream chunk', e);
          }
        }
      }
    }
  }
};
