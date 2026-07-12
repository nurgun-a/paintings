import React from 'react';
import { useQuest } from '../context/QuestContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Trophy, Award, Calendar, Clock, BarChart2, CheckCircle, 
  MapPin, Lock, BookOpen, Camera, Mic, Video, HelpCircle, FileText
} from 'lucide-react';

export const ProgressView: React.FC = () => {
  const { profile, progress, tasks, theme } = useQuest();
  const navigate = useNavigate();

  // Protect route
  React.useEffect(() => {
    if (!profile?.registered) {
      navigate('/register');
    }
  }, [profile, navigate]);

  const totalTasks = tasks.length;
  const completedCount = progress.completedTaskIds.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const isFinished = completedCount === totalTasks && totalTasks > 0;

  // Calculate duration
  const getDurationString = () => {
    if (!progress.startedAt) return 'Только начали';
    const start = new Date(progress.startedAt).getTime();
    const end = progress.finishedAt ? new Date(progress.finishedAt).getTime() : Date.now();
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} мин.`;
    }
    const hrs = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hrs} ч. ${mins} мин.`;
  };

  return (
    <div className="space-y-6 pb-24 font-sans text-slate-800 dark:text-slate-200">
      
      {/* Title Header */}
      <div className="flex items-center gap-3">
        <div className="bg-cyan-500/10 p-2.5 rounded-2xl border border-cyan-500/20 text-cyan-500 dark:text-cyan-400">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ваш Прогресс</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-500">
            Дневник экспедиции и статистика прохождения
          </p>
        </div>
      </div>

      {/* Main Stats Bento Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-md border border-slate-200 dark:border-zinc-800/80 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(6,182,212,0.04),transparent)] pointer-events-none"></div>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-900 dark:text-white">Общие показатели</h3>
          </div>
          <span className="text-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold px-2.5 py-1 rounded-full border border-cyan-500/20">
            {completedCount} из {totalTasks} ({progressPercent}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-zinc-950 h-3 rounded-full overflow-hidden relative border border-slate-200/65 dark:border-zinc-900">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-cyan-500 rounded-full"
          />
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-mono">Время в пути</span>
              <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">{getDurationString()}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 block uppercase font-mono">Статус квеста</span>
              <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isFinished ? '🏆 Завершен!' : '🧭 Исследование'}
              </strong>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Exploration Log Book */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Бортовой журнал экспедиции
          </h3>
        </div>

        <div className="space-y-4">
          {tasks.map((task, index) => {
            const isCompleted = progress.completedTaskIds.includes(task.id);
            const answer = progress.answers[task.id];
            const photo = progress.photos[task.id];
            const audio = progress.audios[task.id];
            const video = progress.videos[task.id];

            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-2xl p-4 border transition-all ${
                  isCompleted 
                    ? 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-zinc-800/80 shadow-sm' 
                    : 'bg-slate-100/50 dark:bg-[#111114]/50 border-slate-200/50 dark:border-zinc-900/60 opacity-60'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-850/80">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' 
                        : 'bg-slate-200 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{task.title}</h4>
                  </div>
                  
                  <span className="text-[9px] text-slate-400 dark:text-zinc-550 font-mono tracking-wider uppercase">
                    {task.type}
                  </span>
                </div>

                {/* Content */}
                <div className="text-xs mt-2.5 space-y-2">
                  {!isCompleted ? (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-zinc-550 py-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span className="font-medium">Задание еще не завершено</span>
                    </div>
                  ) : (
                    <div className="space-y-2 text-slate-600 dark:text-slate-350 leading-relaxed">
                      <p className="italic text-slate-400 dark:text-zinc-500">«{task.description.split('.')[0]}.»</p>
                      
                      {/* Riddle Answers */}
                      {task.type === 'riddle' && (
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          Ответ: <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">"{answer}"</span>
                        </p>
                      )}

                      {/* QR Answers */}
                      {task.type === 'qrcode' && (
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          Считанный код: <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">"{answer}"</span>
                        </p>
                      )}

                      {/* Geolocation */}
                      {task.type === 'geolocation' && (
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 font-mono text-[11px]">
                          <MapPin className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                          <span>{answer || 'Геолокация подтверждена'}</span>
                        </div>
                      )}

                      {/* Photo */}
                      {task.type === 'photo' && photo && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-550 block font-bold uppercase tracking-wider">Фотофиксация:</span>
                          <div className="max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-950">
                            <img src={photo} alt={task.title} className="w-full max-h-36 object-cover" />
                          </div>
                        </div>
                      )}

                      {/* Audio */}
                      {task.type === 'audio' && audio && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-550 block font-bold uppercase tracking-wider">Аудиозапись:</span>
                          <audio src={audio} controls className="max-w-xs h-8 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850" />
                        </div>
                      )}

                      {/* Video */}
                      {task.type === 'video' && video && (
                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-550 block font-bold uppercase tracking-wider">Видеоподтверждение:</span>
                          <video src={video} controls className="max-w-xs rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 max-h-32" />
                        </div>
                      )}
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
