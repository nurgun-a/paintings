import React, { useState, useRef, useEffect } from 'react';
import { useQuest } from '../context/QuestContext';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Compass, User, RefreshCw, Sparkles, MessageCircle, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ChatView: React.FC = () => {
  const { 
    chatMessages, sendChatMessage, triggerSpiritGreeting, isChatLoading, currentTask, profile, resetQuest 
  } = useQuest();
  const [input, setInput] = useState('');
  const [showTaskInfo, setShowTaskInfo] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Track last active and handle welcome back + inactivity nudges
  const hasNudgedRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Route protection
  useEffect(() => {
    if (!profile?.registered) {
      navigate('/register');
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!profile?.registered) return;

    // Check for welcome back greeting (if last chat was > 3 hours ago)
    const lastActiveStr = localStorage.getItem('quest_last_chat_active_time');
    const now = Date.now();
    
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      const hoursDiff = (now - lastActive) / (1000 * 60 * 60);
      if (hoursDiff >= 3 && chatMessages.length > 0 && !isChatLoading) {
        triggerSpiritGreeting("Игрок зашел в чат спустя долгое время (более 3 часов). Поприветствуй его как живой Дух Иччи!");
      }
    }
    
    localStorage.setItem('quest_last_chat_active_time', now.toString());
  }, [profile, triggerSpiritGreeting]);

  // Inactivity nudge: if user is idle on chat view for > 25 seconds
  useEffect(() => {
    if (!profile?.registered || isChatLoading) return;

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    if (!hasNudgedRef.current) {
      idleTimerRef.current = setTimeout(() => {
        if (!isChatLoading && !hasNudgedRef.current) {
          hasNudgedRef.current = true;
          triggerSpiritGreeting("[Игрок зашел и долго не пишет в чат. Напиши ему мудрое и загадочное напутствие, мотивирующее задать вопрос или продолжить путь!]");
        }
      }, 25000); // 25 seconds of idle
    }

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [input, chatMessages, isChatLoading, profile, triggerSpiritGreeting]);

  // Scroll to bottom when messages list changes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isChatLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;

    const messageToSend = input;
    setInput('');
    await sendChatMessage(messageToSend);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto rounded-3xl overflow-hidden bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/80 shadow-md dark:shadow-2xl font-sans transition-colors duration-300">
      
      {/* Top Bar / Task Helper Context */}
      <div className="bg-slate-50 dark:bg-[#111114] p-4 border-b border-slate-200 dark:border-zinc-800/80 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2.5 rounded-2xl border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white font-sans">Дух Иччи</h2>
            <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> В сети • Покровитель квеста
            </p>
          </div>
        </div>

        {currentTask && (
          <button
            onClick={() => setShowTaskInfo(!showTaskInfo)}
            className="text-xs bg-slate-100 hover:bg-cyan-600 hover:text-white dark:bg-zinc-800 dark:hover:bg-cyan-600 px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/60 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Задание {currentTask.id}</span>
          </button>
        )}
      </div>

      {/* Expandable Task Info */}
      <AnimatePresence>
        {currentTask && showTaskInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-500/5 border-b border-slate-200 dark:border-zinc-800/80 px-4 py-3.5"
          >
            <p className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider font-mono">Контекст подсказки:</p>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">Текущее задание: "{currentTask.title}"</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {currentTask.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 bg-slate-50/50 dark:bg-zinc-950/20">
        {chatMessages.map((msg) => {
          const isAI = msg.sender === 'ai';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center border text-xs font-bold ${
                isAI 
                  ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25' 
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-zinc-700/80'
              }`}>
                {isAI ? <Compass className="w-4 h-4 animate-spin-slow" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Capsule */}
              <div className="space-y-1">
                <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${
                  isAI 
                    ? 'bg-white dark:bg-[#111114] border-slate-100 dark:border-zinc-850/80 text-slate-800 dark:text-slate-200 rounded-tl-none' 
                    : 'bg-cyan-600 border-cyan-600 text-white font-bold rounded-tr-none'
                }`}>
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono block text-right px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Typing Loader Indicator */}
        {isChatLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25 text-xs">
              <Compass className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white dark:bg-[#111114] border border-slate-100 dark:border-zinc-850/80 p-3.5 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-bold">Дух Иччи шепчет тайны тайги...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-slate-50 dark:bg-[#111114] border-t border-slate-200 dark:border-zinc-800/85 flex gap-2 transition-colors">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isChatLoading}
          placeholder="Спросить подсказку у Духа Иччи..."
          className="flex-1 px-4 py-2.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-cyan-500/40 transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isChatLoading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-md cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
