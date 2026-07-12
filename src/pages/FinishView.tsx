import React, { useEffect, useState } from 'react';
import { useQuest } from '../context/QuestContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, Trophy, Calendar, Clock, RefreshCw, CheckCircle2, 
  MapPin, Camera, Mic, Video, HelpCircle, Share2, Clipboard, RotateCcw 
} from 'lucide-react';

export const FinishView: React.FC = () => {
  const { profile, progress, tasks, resetQuest, theme } = useQuest();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Monitor progress, protect route if not fully completed
  const totalTasks = tasks.length;
  const completedCount = progress.completedTaskIds.length;
  const isFinished = completedCount === totalTasks && totalTasks > 0;

  useEffect(() => {
    if (!profile?.registered) {
      navigate('/register');
    } else if (!isFinished) {
      navigate('/');
    }
  }, [profile, isFinished, navigate]);

  // Calculate duration
  const getDurationString = () => {
    if (!progress.startedAt || !progress.finishedAt) return '1 ч. 15 мин.';
    const start = new Date(progress.startedAt).getTime();
    const end = new Date(progress.finishedAt).getTime();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} мин.`;
    }
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs} ч. ${mins} мин.`;
  };

  const handleShare = () => {
    const reportText = `🏆 Я прошел городской квест "Тайны Старого Города"!
👤 Исследователь: ${profile?.firstName} (@${profile?.username})
⏱️ Время прохождения: ${getDurationString()}
🎒 Всего пройдено этапов: ${completedCount} из ${totalTasks}

Присоединяйтесь к приключениям!`;

    navigator.clipboard.writeText(reportText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleConfirmReset = () => {
    resetQuest();
    navigate('/');
  };

  return (
    <div className="space-y-8 pb-24 max-w-2xl mx-auto font-sans text-slate-850 dark:text-slate-200">
      
      {/* Celebration Header */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-8 text-center border border-slate-200 dark:border-zinc-800/80 shadow-md relative overflow-hidden transition-colors"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(6,182,212,0.08),transparent)] pointer-events-none"></div>
        
        <div className="flex justify-center mb-4">
          <div className="bg-cyan-500/10 p-4 rounded-full border border-cyan-500/20 relative">
            <Trophy className="w-12 h-12 text-amber-500" />
            <Award className="w-6 h-6 text-cyan-500 absolute -top-1 -right-1" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold font-sans tracking-tight text-slate-900 dark:text-white">Поздравляем!</h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1.5 max-w-md mx-auto leading-relaxed">
          Вы успешно разгадали все древние коды и полностью прошли квест «Тайны Старого Города»!
        </p>

        {/* Stats card inside header */}
        <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/80 max-w-md mx-auto text-left">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-mono tracking-wider">Время в пути</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">{getDurationString()}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-mono tracking-wider">Дата финиша</span>
              <strong className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {progress.finishedAt ? new Date(progress.finishedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-8 space-y-4 max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={handleShare}
              className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> {copied ? 'Скопировано!' : 'Поделиться результатом'}
            </button>
            
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-750 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/60 text-xs font-bold py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> Начать заново
              </button>
            ) : null}
          </div>

          {showResetConfirm && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-center space-y-2.5"
            >
              <p className="text-xs font-bold text-red-600 dark:text-red-400">Вы уверены? Весь ваш прогресс будет сброшен и начнется сначала!</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={handleConfirmReset}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Да, стереть прогресс
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Exploration Journal (Бортовой журнал) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans px-1">
          Ваш бортовой журнал экспедиции
        </h3>

        <div className="space-y-4">
          {tasks.map((task, index) => {
            const answer = progress.answers[task.id];
            const photo = progress.photos[task.id];
            const audio = progress.audios[task.id];
            const video = progress.videos[task.id];

            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-[#18181b] rounded-2xl p-5 border border-slate-200 dark:border-zinc-800/80 space-y-3 relative overflow-hidden transition-colors"
              >
                {/* Header of Task Row */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-zinc-850/80">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[11px] font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-550 font-mono tracking-widest">{task.type.toUpperCase()}</span>
                </div>

                {/* Answer logs */}
                <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                  <p className="italic leading-relaxed text-slate-400 dark:text-zinc-500 pr-4">«{task.description.split('.')[0]}.»</p>
                  
                  {/* Riddle Answers */}
                  {task.type === 'riddle' && (
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Ваш разгаданный ответ: <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">"{answer}"</span>
                    </p>
                  )}

                  {/* QR Answers */}
                  {task.type === 'qrcode' && (
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Считанный код: <span className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">"{answer}"</span>
                    </p>
                  )}

                  {/* Geolocation Answers */}
                  {task.type === 'geolocation' && (
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-400 font-mono text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span>{answer || 'Проверка координат пройдена'}</span>
                    </div>
                  )}

                  {/* Photo logs with real local photo render */}
                  {task.type === 'photo' && photo && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Зафиксированный объект:</span>
                      <div className="max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950">
                        <img src={photo} alt={task.title} className="w-full max-h-40 object-cover" />
                      </div>
                    </div>
                  )}

                  {/* Audio recordings */}
                  {task.type === 'audio' && audio && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Аудиозапись подтверждения:</span>
                      <audio src={audio} controls className="max-w-xs h-9 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200 dark:border-zinc-850" />
                    </div>
                  )}

                  {/* Video recordings */}
                  {task.type === 'video' && video && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase tracking-wider block">Видеозапись панорамы:</span>
                      <video src={video} controls className="max-w-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 max-h-36" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
