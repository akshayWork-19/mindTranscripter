import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


const chatSchema = z.object({
  inpurt: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long')
})




const ChatColumn = ({ messages, onSubmit }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(chatSchema),
    defaultValues: { input: '' }
  })

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleFormSubmit = (data) => {
    onSubmit(data.input);
    reset();
  }

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   if (!input.trim()) return;
  //   onSubmit(input);
  //   setInput('');
  // };

  return (
    <div className="column h-full">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">3. Chat (Detailed Answers)</h2>
        <span className="text-[10px] font-bold text-gray-500">SESSION-ONLY</span>
      </div>

      <Separator className="bg-white/5 mb-6" />

      {/* <div className="info-card">
        Clicking a suggestion adds it to this chat and streams a detailed answer (separate prompt, more context). User can also type questions directly. One continuous chat per session — no login, no persistence.
      </div> */}

      <div className="flex-1 overflow-y-auto premium-scroll">
        {messages.length === 0 ? (
          <div className="text-center opacity-30 mt-12 text-sm">
            Click a suggestion or type a question below.
          </div>
        ) : (
          <div className="space-y-6 px-2">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col space-y-2 mb-6"
              >
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {msg.role === 'user' ? `YOU · ${msg.type || 'QUESTION'}` : 'ASSISTANT'}
                  </span>
                </div>

                <div className={`p-4 rounded-xl text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-accent-primary/5 border border-accent-primary/10 text-blue-100'
                  : 'bg-[#161821] border border-white/5'
                  }`}>
                  {msg.isGenerating ? (
                    <div className="space-y-3 py-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2">Thinking...</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full w-full animate-pulse" />
                      <div className="h-2 bg-white/5 rounded-full w-[90%] animate-pulse" />
                      <div className="h-2 bg-white/5 rounded-full w-[40%] animate-pulse" />
                    </div>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <Separator className="bg-white/5 mt-4" />

      <form onSubmit={handleSubmit(handleFormSubmit)} className="chat-input-container">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2">
            <input
              {...register('input')}
              type="text"
              placeholder="Ask anything..."
              className={`chat-input w-full ${errors.input ? 'border-red-500/50 outline-red-500/50' : ''}`}
            />
            <button type="submit" className="primary">
              Send
            </button>
          </div>
          {errors.input && (
            <span className="text-red-500 text-xs px-2 font-medium">{errors.input.message}</span>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatColumn;
