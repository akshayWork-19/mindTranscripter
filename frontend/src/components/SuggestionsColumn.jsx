import React from 'react';
import { RefreshCw, Lightbulb, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from "@/components/ui/separator";

const SuggestionsColumn = ({ batches, onRefresh, isRefreshing, isRecording, recordingTime, onSuggestionClick }) => {
  const countdown = 30 - (recordingTime % 30);

  return (
    <div className="column h-full">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">2. Live Suggestions</h2>
        <span className="text-[10px] font-bold text-gray-500">{batches.length} BATCHES</span>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-[10px] font-bold uppercase tracking-widest text-blue-500/80 hover:text-blue-400 disabled:opacity-50 transition-all flex items-center gap-1.5 bg-blue-500/5 border border-blue-500/20 px-3 py-1.5 rounded-md hover:bg-blue-500/10"
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Reload suggestions
          </button>
          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest tabular-nums">
            Auto-refresh in {countdown}s
          </span>
        </div>

        <Separator className="bg-white/5 mb-6" />

        {/* <div className="info-card">
          On reload (or auto every ~30s), generate 3 fresh suggestions from recent transcript context. New batch appears at the top; older batches push down (faded). Each is a tappable card: a <span className="text-blue-400">question to ask</span>, a <span className="text-purple-400">talking point</span>, an <span className="text-green-400">answer</span>, or a <span className="text-orange-400">fact-check</span>. The preview alone should already be useful.
        </div> */}

        <div className="flex-1 overflow-y-auto premium-scroll">
          <AnimatePresence initial={false}>
            {batches.length === 0 ? (
              <div className="text-center opacity-30 mt-12 text-sm">
                Suggestions appear here once recording starts.
              </div>
            ) : (
              <div className="space-y-6">
                {batches.map((batch, batchIdx) => (
                  <div key={batch.id} className="space-y-6">
                    {/* Batch Separator */}
                    <div className="flex items-center justify-center gap-4 opacity-30 my-4">
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                        BATCH {batches.length - batchIdx} · {batch.timestamp}
                      </span>
                      <div className="h-[1px] flex-1 bg-white/20"></div>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: batchIdx === 0 ? 1 : 0.3,
                        y: 0,
                        transition: { duration: 0.3 }
                      }}
                      className="space-y-4"
                    >
                      {batch.suggestions.map((s, i) => (
                        <div
                          key={i}
                          onClick={() => onSuggestionClick(s)}
                          className={`suggestion-card ${batchIdx === 0 ? 'active-batch' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${s.type === 'fact-check' ? 'bg-orange-500/10 text-orange-400' :
                              s.type === 'question' ? 'bg-blue-500/10 text-blue-400' :
                                s.type === 'talking-point' ? 'bg-purple-500/10 text-purple-400' :
                                  'bg-green-500/10 text-green-400'
                              }`}>
                              {s.type.replace('-', ' ')}
                            </span>
                          </div>
                          <h3 className="text-[13px] font-semibold mb-1 leading-snug">{s.title}</h3>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsColumn;
