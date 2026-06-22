import React, { useState, useEffect } from 'react';
import { Save, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


const settingsSchema = z.object({
  apiKey: z.string().optional(),
  suggestionModel: z.string().min(1),
  // Coerce converts string inputs from HTML to numbers before validation
  contextWindow: z.coerce.number().min(1, "Must use at least 1 chunk").max(50, 'Max limit is 50 chunks'),
  suggestionPrompt: z.string().min(10, "Prompt must be atleast 10 character"),
  chatPrompt: z.string().min(10, "Prompt must be atleast 10 characters")
})

const SettingsModal = ({ open, settings, onSave, onClose }) => {

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      ...settings,
      apiKey: localStorage.getItem('groq_api_key') || ''
    }
  });

  const [formData, setFormData] = useState({
    ...settings,
    apiKey: localStorage.getItem('groq_api_key') || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (open) {
      reset({
        ...settings,
        apiKey: localStorage.getItem('groq_api_key') || ''
      });
    }
  }, [open, settings, reset]);

  const onValidSubmit = (data) => {
    const { apiKey, ...rest } = data;
    localStorage.setItem('groq_api_key', apiKey || '');
    onSave(rest);
  };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   const { apiKey, ...rest } = formData;
  //   localStorage.setItem('groq_api_key', apiKey);
  //   onSave(rest);
  // };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col bg-[#0c0d12] border-white/10 text-white p-0 overflow-hidden shadow-3xl">
        <DialogHeader className="p-6 border-b border-white/10 bg-white/[0.02] shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-3">
            <Key className="text-blue-500 w-5 h-5" />
            <span>System <span className="text-blue-500">Configuration</span></span>
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">Configure your AI models, prompts, and context window for the session.</p>
        </DialogHeader>

        <form id="settings-form" onSubmit={handleSubmit(onValidSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6 premium-scroll">

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Groq API Key</label>
              <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded">Security: Local Storage Only</span>
            </div>
            <input
              type="password"
              {...register('apiKey')}
              placeholder="gsk_..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm focus:border-blue-500/50 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inference Model</label>
              <select
                {...register('suggestionModel')}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Versatile)</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Instant)</option>
                <option value="llama3-70b-8192">Llama 3 70B</option>
                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Context History (Chunks)</label>
              <input
                type="number"
                {...register('contextWindow')}
                className={`w-full bg-black/40 border rounded-xl py-4 px-5 text-sm outline-none transition-all ${errors.contextWindow ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-blue-500/50'}`}
              />
              {errors.contextWindow && <p className="text-red-500 text-xs font-medium">{errors.contextWindow.message}</p>}
            </div>
          </div>
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">1. Live Suggestions Strategy</label>
              </div>
              <textarea
                rows={6}
                {...register('suggestionPrompt')}
                className={`w-full bg-black/40 border rounded-xl py-4 px-5 text-sm outline-none resize-none premium-scroll font-mono text-gray-300 leading-relaxed ${errors.suggestionPrompt ? 'border-red-500' : 'border-white/10 focus:border-blue-500/50'}`}
              />
              {errors.suggestionPrompt && <p className="text-red-500 text-xs font-medium">{errors.suggestionPrompt.message}</p>}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">2. Detailed Assistant Behavior</label>
              </div>
              <textarea
                rows={6}
                {...register('chatPrompt')}
                className={`w-full bg-black/40 border rounded-xl py-4 px-5 text-sm outline-none resize-none premium-scroll font-mono text-gray-300 leading-relaxed ${errors.chatPrompt ? 'border-red-500' : 'border-white/10 focus:border-blue-500/50'}`}
              />
              {errors.chatPrompt && <p className="text-red-500 text-xs font-medium">{errors.chatPrompt.message}</p>}
            </div>
          </div>
        </form>

        <DialogFooter className="p-8 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-white/5 px-8 h-12 rounded-xl"
          >
            Discard
          </Button>
          <Button
            type="submit"
            form="settings-form"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 px-10 h-12 rounded-xl shadow-xl shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <Save size={18} /> Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
