import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Shield, Briefcase, Award, Sparkles, BookOpen, User } from 'lucide-react';
import { PlayerProfile, QuestProject } from '../../packages/types';

interface ProfileTabProps {
  playerProfile: PlayerProfile | null;
  projects: QuestProject[];
  onUpdateUsername: (newUsername: string) => void;
  onLogout?: () => void;
}

const AVAILABLE_AVATARS = ['🧙‍♂️', '🥷', '🧑‍🚀', '🧗', '🤠', '🦊', '🦉', '🐺', '🐉', '⚡️', '🔥', '🌲'];

export default function ProfileTab({
  playerProfile,
  projects,
  onUpdateUsername,
  onLogout
}: ProfileTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(playerProfile?.username || '');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');

  if (!playerProfile) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-140px)] bg-slate-950 p-4">
        <p className="text-sm font-mono text-slate-500">Загрузка профиля...</p>
      </div>
    );
  }

  const completedQuestsCount = Object.values(playerProfile.questProgress || {}).filter(q => q?.completed).length;
  const activeQuestsCount = Object.keys(playerProfile.questProgress || {}).length - completedQuestsCount;

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    onUpdateUsername(editedName.trim());
    setIsEditing(false);
  };

  return (
    <div id="profile-tab-view" className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto space-y-4 h-[calc(100vh-140px)] bg-slate-950 pb-20">
      
      {/* 1. HERO AVATAR CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl relative overflow-hidden backdrop-blur-sm"
      >
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl" />

        <div className="flex items-center gap-4">
          {/* Animated Avatar Circle */}
          <div className="relative group">
            <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-3xl shadow-lg relative">
              {selectedAvatar}
              <span className="absolute -bottom-1 -right-1 bg-sky-500 text-white font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md border border-slate-900">
                Lvl {playerProfile.level}
              </span>
            </div>
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-500 w-full"
                />
                <button
                  onClick={handleSaveName}
                  className="bg-sky-500 hover:bg-sky-400 text-white text-xs px-2.5 rounded-lg font-bold"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-lg text-white leading-tight">
                  {playerProfile.username}
                </h3>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-slate-500 hover:text-sky-400 text-[10px] font-mono"
                >
                  (ред.)
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider">
                {playerProfile.rank}
              </span>
            </div>
          </div>
        </div>

        {/* XP PROGRESS BAR */}
        <div className="mt-5">
          <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1.5">
            <span>Опыт: {playerProfile.xp % 500} / 500 XP</span>
            <span>Ранг {playerProfile.level}</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/80">
            <div
              className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${((playerProfile.xp % 500) / 500) * 100}%` }}
            />
          </div>
        </div>

        {/* AVATAR CHOOSER GRID */}
        <div className="mt-4 pt-4 border-t border-slate-800/60">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Выберите игровую иконку:</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_AVATARS.map(emoji => (
              <button
                key={emoji}
                onClick={() => setSelectedAvatar(emoji)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border text-sm transition-all ${selectedAvatar === emoji ? 'bg-sky-500/10 border-sky-500 scale-110' : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 2. STATS OVERVIEW BENTO GRID */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Квесты
          </span>
          <div className="mt-2.5 text-left">
            <span className="text-2xl font-mono font-bold text-white">{completedQuestsCount}</span>
            <span className="text-xs text-slate-500 font-mono ml-1">пройдено</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Награды
          </span>
          <div className="mt-2.5 text-left">
            <span className="text-2xl font-mono font-bold text-white">{(playerProfile.achievements || []).length}</span>
            <span className="text-xs text-slate-500 font-mono ml-1">уникальных</span>
          </div>
        </div>
      </div>

      {/* 3. INVENTORY BACKPACK */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl backdrop-blur-sm">
        <h4 className="font-display font-semibold text-sm text-slate-300 flex items-center gap-2 mb-4">
          <Briefcase className="w-4 h-4 text-sky-400 animate-pulse" />
          Рюкзак и Инвентарь Искателя ({(playerProfile.inventory || []).length})
        </h4>

        {(playerProfile.inventory || []).length === 0 ? (
          <div className="bg-slate-950 p-4 rounded-xl text-center border border-slate-800/60">
            <p className="text-xs text-slate-500">В вашем рюкзаке пока пусто. Проходите испытания, чтобы получить артефакты.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {(playerProfile.inventory || []).map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-lg">
                  {item.includes('Компас') ? '🧭' : item.includes('Сердце') ? '❤️' : item.includes('Печать') ? '🔱' : '🎒'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{item}</p>
                  <p className="text-[9px] font-mono text-slate-500">Артефакт</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 4. LOGOUT / SWITCH PLAYER */}
      {onLogout && (
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Выйти / Сменить игрока
          </button>
        </div>
      )}

    </div>
  );
}
