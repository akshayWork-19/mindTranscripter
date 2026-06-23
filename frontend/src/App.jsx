import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Zap } from 'lucide-react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { api } from './services/api';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ErrorFallback';
import { Toaster, toast } from 'react-hot-toast';

// Components
import TranscriptColumn from './components/TranscriptColumn';
import SuggestionsColumn from './components/SuggestionsColumn';
import ChatColumn from './components/ChatColumn';
import SettingsModal from './components/SettingsModal';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_SETTINGS = {
  suggestionPrompt: `You are an expert Meeting Analyst. Analyze the provided meeting transcript segments and generate exactly 3 highly relevant, concise, and professional suggestions. 

Suggestions must be categorized into:
- 'fact-check': Verify a specific statement, date, or data point mentioned.
- 'question': A high-impact question to challenge or explore the speaker's point.
- 'talking-point': A strategic topic or next step to bring up.
- 'clarification': An ambiguity or potential misunderstanding that needs clearing up.

Output MUST be a valid JSON object with a 'suggestions' key containing an array of exactly 3 objects:
{
  "suggestions": [
    { "title": "Concise Title", "preview": "Brief explanation (1 sentence)", "type": "fact-check | question | talking-point | clarification" }
  ]
}`,
  chatPrompt: `You are a Senior Meeting Copilot and Executive Assistant. Your goal is to provide deep, contextual insights based on the meeting transcript. 

When a user asks a question or clicks a suggestion:
- Use professional Markdown for formatting (bolding, bullet points, headers).
- Provide a structured, detailed answer.
- If the answer isn't in the transcript, provide a helpful general response but note that it's based on external knowledge.
- Maintain a professional, executive tone.`,
  suggestionModel: 'llama-3.3-70b-versatile',
  chatModel: 'llama-3.3-70b-versatile',
  contextWindow: 10
};

function App() {
  // State
  const [transcript, setTranscript] = useState([]);
  const [suggestionBatches, setSuggestionBatches] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [transcriptError, setTranscriptError] = useState(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('twinmind_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const transcriptEndRef = useRef(null);

  // Generate Suggestions
  const generateSuggestions = useCallback(async (customTranscript = null) => {
    if (isRefreshing) return;
    const transcriptToUse = customTranscript || transcript;
    if (transcriptToUse.length === 0) return;

    setIsRefreshing(true);
    try {
      const response = await api.generateSuggestions(
        transcriptToUse.slice(-settings.contextWindow),
        settings.suggestionPrompt,
        settings.suggestionModel
      );

      if (response.suggestions?.length > 0) {
        setSuggestionBatches(prev => [{
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          suggestions: response.suggestions
        }, ...prev]);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [transcript, settings, isRefreshing]);

  // Handle periodic audio chunks (every 30s)
  const handleChunkReady = useCallback(async (blob) => {
    try {
      if (isTranscribing) {
        console.warn('Previous chunk still processing, skipping!');
        return;
      }
      if (!blob || blob.size < 1000) {
        console.warn('chunk too small, skipping');
        return;
      }
      console.log(`🎤 Processing 30s chunk: ${blob.size} bytes`);
      setIsTranscribing(true);
      const { transcript: newText, error } = await api.transcribe(blob);

      if (error) {
        setTranscriptError(error || 'failed to transcribe this segment. Recording continues');
        return;
      }

      if (newText && newText.trim()) {
        console.log('📝 Transcribed:', newText);
        const updatedTranscript = [...transcript, newText];
        setTranscript(updatedTranscript);
        // IMMEDIATE suggestion refresh on new data
        console.log('🚀 Triggering immediate suggestion refresh for new context...');
        generateSuggestions(updatedTranscript);
      }
    } catch (err) {
      setTranscriptError(err);
    } finally {
      setIsTranscribing(false);
    }
  }, [transcript, generateSuggestions, isTranscribing]);

  const { isRecording, startRecording, stopRecording } = useAudioRecorder(handleChunkReady);

  // Global Session Timer (for auto-refresh countdown)
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Recording Timer Effect
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-refresh suggestions every 30s throughout the session
  useEffect(() => {
    // Start heartbeat immediately and keep it running
    const interval = setInterval(() => {
      // Only generate if we have at least some transcript
      if (transcript.length > 0) {
        console.log('🔄 Auto-refreshing suggestions (Session heartbeat)...');
        generateSuggestions();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [generateSuggestions, transcript.length > 0]);

  // Handle Chat Actions
  const handleChatSubmit = useCallback(async (text, type = 'QUESTION') => {
    const newUserMsg = {
      role: 'user',
      content: text,
      type: type.toUpperCase(),
      timestamp: new Date().toLocaleTimeString()
    };
    setChatMessages(prev => [...prev, newUserMsg]);

    const assistantMsgId = Date.now();
    const assistantMsg = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      id: assistantMsgId
    };

    setChatMessages(prev => [...prev, assistantMsg]);

    try {
      // Use latest context window from transcript
      const context = transcript.slice(-settings.contextWindow).join('\n\n');
      let fullContent = '';

      console.log('🤖 Starting AI response generation...');

      // Update message to show 'generating' status
      setChatMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId ? { ...msg, isGenerating: true } : msg
      ));

      await api.streamChatResponse(
        context,
        text,
        settings.chatPrompt,
        settings.chatModel,
        (token) => {
          fullContent += token;
          setChatMessages(prev => prev.map(msg =>
            msg.id === assistantMsgId ? { ...msg, content: fullContent } : msg
          ));
        }
      );

      // Once complete, update with full content and turn off generating state
      setChatMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId ? { ...msg, content: fullContent, isGenerating: false } : msg
      ));
      console.log('🤖 AI response complete');
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = err.response?.data?.error || err.message;
      setChatMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, content: `Error: ${errorMsg}`, isGenerating: false, isError: true }
          : msg
      ));
    }
  }, [transcript, settings]);

  // Export Session
  const handleExport = () => {
    const sessionData = {
      timestamp: new Date().toISOString(),
      transcript,
      suggestionBatches,
      chatMessages
    };
    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindtranscripter-session-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="flex flex-col h-screen bg-[#0c0d12] text-white">
      {/* Sleek Navbar */}
      <Toaster
        position="top-right"
        toastOptions={{
          // Styled to match your sleek dark theme!
          style: {
            background: '#161821',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } }
        }}
      />
      <nav className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#111218]/50 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap size={18} className="text-white" fill="white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">
            Mind<span className="text-blue-500">Transcripter</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold font-mono text-red-500 tabular-nums">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {isRecording ? 'Recording Live' : 'System Idle'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className="hover:bg-white/10 rounded-full"
          >
            <Settings size={20} className="text-gray-400" />
          </Button>
        </div>
      </nav>

      {/* 3-Card Layout Content */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        <Card className="bg-[#111218] border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <TranscriptColumn
              transcript={transcript}
              isRecording={isRecording}
              isTranscribing={isTranscribing}
              onToggleMic={isRecording ? stopRecording : startRecording}
              onExport={handleExport}
              transcriptEndRef={transcriptEndRef}
            />
          </CardContent>
        </Card>

        <Card className="bg-[#111218] border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <SuggestionsColumn
              batches={suggestionBatches}
              onRefresh={generateSuggestions}
              isRefreshing={isRefreshing}
              isRecording={isRecording}
              recordingTime={sessionTime}
              onSuggestionClick={(s) => handleChatSubmit(s.title, s.type)}
            />
          </CardContent>
        </Card>

        <Card className="bg-[#111218] border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
            <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => { }}>
              <ChatColumn
                messages={chatMessages}
                onSubmit={handleChatSubmit}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </main>

      <SettingsModal
        open={isSettingsOpen}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('twinmind_settings', JSON.stringify(newSettings));
          setIsSettingsOpen(false);
        }}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
