import { Mic, MicOff, Download, Play, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const TranscriptColumn = ({ transcript, isRecording, isTranscribing, onToggleMic, onExport, transcriptEndRef }) => {
  return (
    <div className="column h-full">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">1. Mic & Transcript</h2>
        <span className="text-[10px] font-bold text-gray-500">{isRecording ? 'RECORDING' : 'IDLE'}</span>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onToggleMic}
          className={`mic-button ${isRecording ? 'recording' : ''}`}
        />
        <div className="text-sm text-white">
          <p className="font-medium">{isRecording ? 'Recording Live' : 'Click mic to start'}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Transcript appends every ~30s.</p>
        </div>
      </div>

      <Separator className="bg-white/5 mb-6" />

      {/* <div className="info-card">
        The transcript scrolls and appends new chunks every ~30 seconds while recording. Use the mic button to start/stop. Include an export button (not shown) so we can pull the full session.
      </div> */}

      <div className="flex-1 overflow-y-auto premium-scroll">
        {transcript.length === 0 ? (
          <div className="text-center opacity-30 mt-12 text-sm">
            No transcript yet — start the mic.
          </div>
        ) : (
          <div className="space-y-6">
            {transcript.map((chunk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm leading-relaxed border-l-2 border-accent-primary/20 pl-4 py-1"
              >
                {chunk}
              </motion.div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        )}
        {isTranscribing && (
          <div className="flex items-center gap-2 mt-4 text-blue-400 text-xs animate-pulse">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
            Transcribing...
          </div>
        )}
      </div>

      <div className="mt-6">
        <button onClick={onExport}>
          <Download size={14} /> Export Session
        </button>
      </div>
    </div>
  );
};

export default TranscriptColumn;
