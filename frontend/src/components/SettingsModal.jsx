import React, { useState } from 'react';
import { Save, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SettingsModal = ({ open, settings, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    ...settings,
    apiKey: localStorage.getItem('groq_api_key') || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { apiKey, ...rest } = formData;
    localStorage.setItem('groq_api_key', apiKey);
    onSave(rest);
  };

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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 premium-scroll">
          {/* API Key Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Groq API Key</label>
              <span className="text-[10px] text-blue-400 font-medium bg-blue-500/10 px-2 py-0.5 rounded">Security: Local Storage Only</span>
            </div>
            <input 
              type="password"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              placeholder="gsk_..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm focus:border-blue-500/50 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Inference Model</label>
              <select 
                name="suggestionModel"
                value={formData.suggestionModel}
                onChange={handleChange}
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
                name="contextWindow"
                value={formData.contextWindow}
                onChange={handleChange}
                min="1"
                max="50"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm outline-none focus:border-blue-500/50 transition-all"
              />
            </div>
          </div>

          {/* Prompts Section */}
          <div className="space-y-6 pt-4 border-t border-white/5">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">1. Live Suggestions Strategy</label>
                <span className="text-[10px] text-gray-500">Determines the logic for the middle card</span>
              </div>
              <textarea 
                name="suggestionPrompt"
                value={formData.suggestionPrompt}
                onChange={handleChange}
                rows={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm outline-none focus:border-blue-500/50 resize-none premium-scroll font-mono text-gray-300 leading-relaxed"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">2. Detailed Assistant Behavior</label>
                <span className="text-[10px] text-gray-500">Determines how the Chat AI responds</span>
              </div>
              <textarea 
                name="chatPrompt"
                value={formData.chatPrompt}
                onChange={handleChange}
                rows={6}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 px-5 text-sm outline-none focus:border-blue-500/50 resize-none premium-scroll font-mono text-gray-300 leading-relaxed"
              />
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
            onClick={handleSubmit}
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
