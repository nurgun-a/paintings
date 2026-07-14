import React, { useState, useEffect } from 'react';
import { useQuest, ACCENT_PALETTES } from '../context/QuestContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  User, Smartphone, Mail, Award, RotateCcw, Moon, Sun, 
  Save, Eye, CheckCircle, BarChart, Camera, Mic, Video, AlertCircle, Palette
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { 
    profile, progress, tasks, updateProfile, resetQuest, theme, toggleTheme, accentColor, setAccentColor 
  } = useQuest();
  const navigate = useNavigate();

  // Route protection
  useEffect(() => {
    if (!profile?.registered) {
      navigate('/register');
    }
  }, [profile, navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        phone: profile.phone,
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.username.trim() || !formData.phone.trim()) {
      setErrorMsg('Пожалуйста, заполните все обязательные поля');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }

    updateProfile({
      ...formData,
      registered: true
    });
    setIsEditing(false);
    setErrorMsg('');
    setSuccessMsg('Профиль успешно обновлен!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleConfirmReset = () => {
    resetQuest();
    setSuccessMsg('Прогресс успешно сброшен!');
    setShowResetConfirm(false);
    setTimeout(() => {
      setSuccessMsg('');
      navigate('/');
    }, 1500);
  };

  const totalTasks = tasks.length;
  const completedCount = progress.completedTaskIds.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Calculate statistics
  const photoCount = Object.keys(progress.photos).length;
  const audioCount = Object.keys(progress.audios).length;
  const videoCount = Object.keys(progress.videos).length;

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto font-sans text-slate-850 dark:text-slate-200">
      
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-md border border-slate-200 dark:border-zinc-800/80 text-center relative overflow-hidden transition-colors"
      >
        <div className="absolute top-0 right-0 p-4">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 text-cyan-600 dark:text-cyan-400 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-600" />}
          </button>
        </div>

        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-sm">
          {profile?.firstName ? profile.firstName[0] : 'И'}{profile?.lastName ? profile.lastName[0] : 'К'}
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white font-sans mt-3">
          {profile?.firstName} {profile?.lastName}
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500">@{profile?.username}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800/80">
          <div className="bg-slate-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-850/60 text-center">
            <Camera className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">Фото</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{photoCount}</span>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-850/60 text-center">
            <Mic className="w-4 h-4 text-red-500 dark:text-red-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">Аудио</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{audioCount}</span>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-850/60 text-center">
            <Video className="w-4 h-4 text-amber-500 dark:text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 block font-medium">Видео</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{videoCount}</span>
          </div>
        </div>
      </motion.div>

      {/* Profile Form (Edit mode toggleable) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-md border border-slate-200 dark:border-zinc-800/80 transition-colors"
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
            <h3 className="font-bold text-slate-900 dark:text-white font-sans">Данные профиля</h3>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
          >
            {isEditing ? 'Отмена' : 'Редактировать'}
          </button>
        </div>

        {successMsg && (
          <div className="p-3 bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs rounded-xl flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase mb-1">Имя</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 disabled:opacity-75 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase mb-1">Фамилия</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 disabled:opacity-75 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase mb-1">Никнейм</label>
            <input
              type="text"
              disabled={!isEditing}
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 disabled:opacity-75 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase mb-1">Телефон</label>
            <input
              type="tel"
              disabled={!isEditing}
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 disabled:opacity-75 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase mb-1">Email</label>
            <input
              type="email"
              disabled={!isEditing}
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="Не указан"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-950 disabled:opacity-75 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-cyan-500"
            />
          </div>

          {isEditing && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" /> Сохранить изменения
            </motion.button>
          )}
        </form>
      </motion.div>

      {/* Accent Color Palette Selector */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-md border border-slate-200 dark:border-zinc-800/80 space-y-4 transition-colors"
      >
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
          <Palette className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white font-sans">Цветовое оформление</h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Выберите основные тона для вашего богатырского пути</p>
          </div>
        </div>

        <div className="space-y-2">
          {ACCENT_PALETTES.map((palette) => {
            const isSelected = accentColor === palette.id;
            return (
              <button
                key={palette.id}
                onClick={() => setAccentColor(palette.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer group hover:scale-[1.01] ${
                  isSelected 
                    ? 'bg-cyan-500/5 border-cyan-500 dark:border-cyan-500/80 shadow-sm' 
                    : 'bg-slate-50/50 dark:bg-zinc-950/20 border-slate-150 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-950/40 hover:border-slate-300 dark:hover:border-zinc-800'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                      {palette.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                        Активен
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-550 leading-relaxed max-w-sm">
                    {palette.description}
                  </p>
                </div>

                {/* Swatches block */}
                <div className="flex items-center gap-1.5 shrink-0 bg-white/60 dark:bg-zinc-900/40 p-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/40 shadow-inner">
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: palette.colors['400'] }} title="400" />
                  <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: palette.colors['500'] }} title="500" />
                  <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: palette.colors['550'] }} title="550" />
                  <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: palette.colors['600'] }} title="600" />
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-md border border-slate-200 dark:border-zinc-800/80 space-y-4 transition-colors"
      >
        <div className="flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-red-500" />
          <h3 className="font-bold text-slate-900 dark:text-white font-sans">Опасная зона</h3>
        </div>
        
        <p className="text-xs text-slate-450 dark:text-zinc-500">
          Сброс сотрет ваши результаты, очистит чаты и файлы. Выход сотрет ваш логин и вернет к экрану регистрации.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* RESET QUEST TRIGGER */}
          <div className="flex-1">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 bg-red-500/5 hover:bg-red-600 hover:text-white border border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Сбросить прогресс
              </button>
            ) : (
              <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl space-y-2">
                <p className="text-[11px] font-bold text-red-500 text-center">Сбросить квест?</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleConfirmReset}
                    className="py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Да, сбросить
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-1.5 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* LOGOUT BUTTON */}
          <button
            onClick={() => {
              if (window.confirm('Вы действительно хотите выйти из профиля? Все локальные данные профиля и прогресса будут удалены.')) {
                localStorage.removeItem('quest_player_profile');
                localStorage.removeItem('quest_progress');
                localStorage.removeItem('quest_chat_history');
                localStorage.removeItem('quest_focused_task_id');
                window.location.href = '/register';
              }
            }}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-950 dark:hover:bg-zinc-900 border border-slate-200 dark:border-zinc-850 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" /> Выйти из профиля
          </button>
        </div>
      </motion.div>
    </div>
  );
};
