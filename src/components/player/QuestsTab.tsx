import React from 'react';
import { motion } from 'motion/react';
import { Compass, CheckCircle2, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { QuestProject, PlayerProfile } from '../../packages/types';

interface QuestsTabProps {
  projects: QuestProject[];
  playerProfile: PlayerProfile | null;
  selectedQuestId: string;
  onJoinQuest: (id: string) => void;
  onSelectQuest: (id: string) => void;
}

export default function QuestsTab({
  projects,
  playerProfile,
  selectedQuestId,
  onJoinQuest,
  onSelectQuest
}: QuestsTabProps) {
  const publishedQuests = projects.filter(p => p.status === 'published');

  return (
    <div id="quests-tab-view" className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto space-y-4 h-[calc(100vh-140px)] bg-slate-950 pb-20">
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg text-white">Список Квест-Проектов</h2>
        <p className="text-xs text-slate-400 font-sans">Выберите испытание из доступных Хранителями миров</p>
      </div>

      {publishedQuests.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl text-center">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Нет опубликованных квестов на сервере.</p>
        </div>
      ) : (
        publishedQuests.map((quest) => {
          const progress = playerProfile?.questProgress[quest.id];
          const isJoined = !!progress;
          const isCompleted = progress?.completed;
          const isSelected = selectedQuestId === quest.id;

          return (
            <motion.div
              key={quest.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-sm ${isSelected ? 'bg-sky-500/10 border-sky-500' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}
            >
              {/* Cover top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${isCompleted ? 'bg-emerald-500' : isJoined ? 'bg-sky-500' : 'bg-slate-800'}`} />

              <div className="flex justify-between items-start gap-4 mb-2">
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">
                    {quest.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-sans leading-normal mt-1">
                    {quest.description || 'Увлекательный поход по заповедным местам с Ведущим ИИ.'}
                  </p>
                </div>

                {isCompleted ? (
                  <span className="flex-shrink-0 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Пройден
                  </span>
                ) : isJoined ? (
                  <span className="flex-shrink-0 bg-sky-500/10 border border-sky-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                    Активен
                  </span>
                ) : (
                  <span className="flex-shrink-0 bg-slate-950 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                    Доступен
                  </span>
                )}
              </div>

              {/* Quest details info */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-[10px] font-mono text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                <span>NPC: <span className="text-slate-300 font-semibold">{quest.npcs[0]?.name || 'Проводник'} ({quest.npcs[0]?.avatar || '🧙‍♂️'})</span></span>
                <span>Шагов: <span className="text-slate-300 font-semibold">{quest.steps.length} шт</span></span>
              </div>

              {/* Actions footer */}
              <div className="mt-4 flex justify-between items-center">
                {isJoined ? (
                  <div className="text-[10px] font-mono text-slate-400">
                    {isCompleted ? (
                      <span className="text-emerald-400">Все этапы выполнены!</span>
                    ) : (
                      <span>Шаг <span className="text-sky-400 font-bold">{(progress?.currentStepIndex || 0) + 1}</span> из {quest.steps.length}</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">Запустите для прохождения</span>
                )}

                <button
                  onClick={() => {
                    if (!isJoined) {
                      onJoinQuest(quest.id);
                    } else {
                      onSelectQuest(quest.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${isSelected ? 'bg-sky-500 text-white shadow-md shadow-sky-500/15' : 'bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300'}`}
                >
                  {isJoined ? (
                    <>
                      {isSelected ? 'Открыть Чат' : 'Переключить'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    'Начать Квест'
                  )}
                </button>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
