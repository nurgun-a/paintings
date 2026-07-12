import React from 'react';
import { motion } from 'motion/react';
import { Award, Lock, CheckCircle2, Trophy, Star } from 'lucide-react';
import { PlayerProfile } from '../../packages/types';

interface AchievementsTabProps {
  playerProfile: PlayerProfile | null;
}

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji
  rewardXp: number;
}

const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'Первый Шаг', title: 'Первый Шаг', description: 'Зарегистрируйте свой профиль и начните путь таежного искателя', icon: '🐾', rewardXp: 100 },
  { id: 'Мудрец Рун', title: 'Мудрец Рун', description: 'Правильно ответьте на сложную загадку Хранителя текстом', icon: '📖', rewardXp: 200 },
  { id: 'Охотник за Фото', title: 'Охотник за Фото', description: 'Отправьте фотографию, которая совпадет с эталоном более чем на 80%', icon: '📷', rewardXp: 250 },
  { id: 'Властелин Времени', title: 'Властелин Времени', description: 'Завершите задание по таймеру до истечения священных секунд', icon: '⏳', rewardXp: 300 },
  { id: 'Следопыт Тайги', title: 'Следопыт Тайги', description: 'Успешно подтвердите GPS координаты секретного места назначения', icon: '📍', rewardXp: 300 },
  { id: 'Хранитель Севера', title: 'Хранитель Севера', description: 'Успешно завершите хотя бы один полноценный AI квест целиком', icon: '🔱', rewardXp: 500 }
];

export default function AchievementsTab({ playerProfile }: AchievementsTabProps) {
  if (!playerProfile) return null;

  return (
    <div id="achievements-tab-view" className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto space-y-4 h-[calc(100vh-140px)] bg-slate-950 pb-20">
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500 animate-bounce" /> Достижения и Ранги
        </h2>
        <p className="text-xs text-slate-400 font-sans">Открывайте достижения во время прохождения квестов для получения XP</p>
      </div>

      <div className="flex flex-col gap-3">
        {ALL_ACHIEVEMENTS.map((ach) => {
          const isUnlocked = playerProfile.achievements.includes(ach.title) || playerProfile.achievements.includes(ach.id);

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-2xl border flex gap-4 items-center transition-all relative ${isUnlocked ? 'bg-gradient-to-tr from-amber-500/10 to-slate-900/60 border-amber-500/30' : 'bg-slate-900/40 border-slate-800/80 grayscale'}`}
            >
              {/* Achievement Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border flex-shrink-0 ${isUnlocked ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>
                {ach.icon}
              </div>

              {/* Achievement Info */}
              <div className="flex-1 min-w-0 text-left">
                <div className="flex justify-between items-baseline gap-2">
                  <h3 className={`font-display font-semibold text-xs truncate ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                    {ach.title}
                  </h3>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${isUnlocked ? 'bg-amber-500/20 text-amber-400 border border-amber-500/10' : 'bg-slate-950 text-slate-600'}`}>
                    +{ach.rewardXp} XP
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal mt-1 font-sans">
                  {ach.description}
                </p>
              </div>

              {/* Unlocked state indicator */}
              <div className="flex-shrink-0">
                {isUnlocked ? (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                ) : (
                  <Lock className="w-5 h-5 text-slate-700" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
