import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Send, Bot, User, ShieldAlert, Image, 
  Paperclip, Sparkles, Zap, AlertCircle, WifiOff 
} from 'lucide-react';
import { ChatMessage, QuestStep } from '../../packages/types';
import EventCard from './EventCard';

interface ChatTabProps {
  chatHistory: ChatMessage[];
  activeStep?: QuestStep;
  sending: boolean;
  onSendMessage: (text: string) => void;
  onSubmitText: (text: string) => Promise<boolean>;
  onSubmitQR: (code: string) => Promise<boolean>;
  onSubmitPhoto: (base64: string) => Promise<boolean>;
  onSubmitLocation: (lat: number, lng: number) => Promise<boolean>;
  onSubmitTimer?: () => Promise<boolean>;
  onTimerComplete: () => void;
  offlineMode: boolean;
  npcName?: string;
  npcAvatar?: string;
}

export default function ChatTab({
  chatHistory,
  activeStep,
  sending,
  onSendMessage,
  onSubmitText,
  onSubmitQR,
  onSubmitPhoto,
  onSubmitLocation,
  onSubmitTimer,
  onTimerComplete,
  offlineMode,
  npcName = 'Проводник',
  npcAvatar = '🧙‍♂️'
}: ChatTabProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, sending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div id="chat-tab-container" className="flex-1 flex flex-col h-[calc(100vh-140px)] max-w-md mx-auto relative bg-slate-950">
      
      {/* Dynamic Offline banner */}
      {offlineMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between z-10">
          <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1.5">
            <WifiOff className="w-3.5 h-3.5" /> ОТСУТСТВУЕТ СЕТЬ. Работа в офлайн-режиме
          </span>
          <span className="text-[9px] text-slate-500 font-mono">Синхронизация при связи</span>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 gap-2 font-sans">
            <Sparkles className="w-10 h-10 text-sky-500/30 animate-pulse" />
            <p className="text-sm font-semibold text-slate-400">Начало диалога</p>
            <p className="text-xs">Напишите что-нибудь ИИ Ведущему для запуска лора...</p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => {
            const isAI = msg.sender === 'gamemaster';
            const isSystem = msg.sender === 'system';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 max-w-[85%] ${isAI ? '' : isSystem ? 'mx-auto w-full max-w-full justify-center' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                {!isSystem && (
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm border shadow-sm ${isAI ? 'bg-slate-900 border-slate-800' : 'bg-sky-500/10 border-sky-500/20'}`}>
                    {isAI ? npcAvatar : '👤'}
                  </div>
                )}

                {/* Content block */}
                {isSystem ? (
                  <div className="w-full bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 text-center my-1.5 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">ВЕСТНИК СИСТЕМЫ</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {/* Header */}
                    <span className="text-[9px] font-mono text-slate-500 px-1">
                      {isAI ? npcName : 'Вы'}
                    </span>

                    {/* Chat Bubble text */}
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed font-sans whitespace-pre-wrap shadow-md ${isAI ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-sm' : 'bg-sky-600 text-white rounded-tr-sm'}`}>
                      {msg.text}
                      {msg.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-800">
                          <img src={msg.imageUrl} alt="Uploaded attachment" className="w-full max-h-48 object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}

        {/* Inline Event Card: display active checkpoint step directly in conversation */}
        {activeStep && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-2.5"
          >
            <EventCard
              step={activeStep}
              onSubmitText={onSubmitText}
              onSubmitQR={onSubmitQR}
              onSubmitPhoto={onSubmitPhoto}
              onSubmitLocation={onSubmitLocation}
              onSubmitTimer={onSubmitTimer}
              onTimerComplete={onTimerComplete}
              offlineMode={offlineMode}
            />
          </motion.div>
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3 max-w-[80%] items-center">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm">
              {npcAvatar}
            </div>
            <div className="bg-slate-900 border border-slate-800 px-4 py-3 rounded-2xl flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Message input bar */}
      <form onSubmit={handleSend} className="p-3 bg-slate-950 border-t border-slate-900 flex items-center gap-2">
        <input
          type="text"
          placeholder={offlineMode ? "Диалог заблокирован оффлайном..." : "Написать ответ Ведущему..."}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sending || offlineMode}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all disabled:opacity-40"
        />
        <button
          id="btn-chat-send"
          type="submit"
          disabled={sending || !inputText.trim() || offlineMode}
          className="p-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white rounded-xl transition-all shadow-lg active:scale-95 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
