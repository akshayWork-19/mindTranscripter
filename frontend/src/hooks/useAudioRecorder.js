import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = (onChunkReady) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting periodic recording (30s chunks)...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';

      const createAndStartRecorder = () => {
        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            console.log(`🎤 30s chunk ready: ${blob.size} bytes`);
            onChunkReady(blob);
          }
        };

        recorder.start();
      };

      // Start the first recorder
      createAndStartRecorder();
      setIsRecording(true);

      // Rotate recorders every 30 seconds
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          console.log('🎤 Rotating 30s chunk...');
          mediaRecorderRef.current.stop();
          createAndStartRecorder();
        }
      }, 30000);

    } catch (err) {
      console.error('Mic error:', err);
      alert('Could not access microphone.');
    }
  }, [onChunkReady]);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    console.log('🎤 Session stopped.');
  }, []);

  return {
    isRecording,
    startRecording,
    stopRecording
  };
};
