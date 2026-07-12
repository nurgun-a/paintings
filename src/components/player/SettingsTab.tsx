import React from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Sun, Moon, Bell, Globe, Trash2, 
  LogOut, Activity, Wifi, WifiOff, CloudLightning 
} from 'lucide-react';

interface SettingsTabProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  language: 'ru' | 'en';
  setLanguage: (lang: 'ru' | 'en') => void;
  onClearCache: () => void;
  onLogout: () => void;
  sseActive: boolean;
  offlineQueueLength: number;
}

export default function SettingsTab({
  theme,
  setTheme,
  notificationsEnabled,
  setNotificationsEnabled,
  language,
  setLanguage,
  onClearCache,
  onLogout,
  sseActive,
  offlineQueueLength
}: SettingsTabProps) {
  return (
    <div id="settings-tab-view" className="flex-1 overflow-y-auto px-4 py-4 max-w-md mx-auto space-y-4 h-[calc(100vh-140px)] bg-slate-950 pb-20">
      <div className="mb-4">
        <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-sky-400" /> Настройки Системы
        </h2>
        <p className="text-xs text-slate-400 font-sans font-normal">Параметры PWA приложения, темы, уведомлений и кэширования</p>
      </div>

      {/* 1. THEME SWITCHER */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-sky-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Тема оформления</p>
            <p className="text-[10px] text-slate-400">Светлая или Темная контрастная тема</p>
          </div>
        </div>
        <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setTheme('light')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${theme === 'light' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Светлая
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${theme === 'dark' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Темная
          </button>
        </div>
      </div>

      {/* 2. NOTIFICATIONS */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Bell className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Уведомления</p>
            <p className="text-[10px] text-slate-400">Разрешить звуки и push-новости</p>
          </div>
        </div>
        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className={`w-11 h-6 rounded-full transition-colors relative ${notificationsEnabled ? 'bg-sky-500' : 'bg-slate-850'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${notificationsEnabled ? 'right-1' : 'left-1'}`} />
        </button>
      </div>

      {/* 3. LANGUAGE SELECT */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
            <Globe className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Язык интерфейса</p>
            <p className="text-[10px] text-slate-400">Изменить язык текстов</p>
          </div>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as any)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
        >
          <option value="ru">Русский (RU)</option>
          <option value="en">English (EN)</option>
        </select>
      </div>

      {/* 4. DIAGNOSTICS CONTROL PANEL */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3.5">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-semibold text-white">Телеметрия соединения</h4>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex flex-col justify-between">
            <span className="text-slate-500">Сервер SSE:</span>
            <span className={`font-bold mt-1.5 flex items-center gap-1.5 ${sseActive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {sseActive ? <Wifi className="w-3.5 h-3.5 animate-pulse" /> : <WifiOff className="w-3.5 h-3.5" />}
              {sseActive ? 'АКТИВЕН' : 'ОФЛАЙН'}
            </span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60 flex flex-col justify-between">
            <span className="text-slate-500">Очередь синхр.:</span>
            <span className={`font-bold mt-1.5 flex items-center gap-1.5 ${offlineQueueLength > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
              <CloudLightning className="w-3.5 h-3.5" />
              {offlineQueueLength} пакетов
            </span>
          </div>
        </div>
      </div>

      {/* 5. DANGEROUS ACTIONS */}
      <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-2.5">
        <button
          onClick={onClearCache}
          className="w-full py-3 bg-slate-950 hover:bg-slate-900 text-slate-300 font-semibold text-xs border border-slate-800 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4 text-slate-400" />
          Очистить локальный кэш IndexedDB
        </button>

        <button
          onClick={onLogout}
          className="w-full py-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 font-semibold text-xs border border-rose-500/10 rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Сбросить Прогресс и Выйти
        </button>
      </div>

    </div>
  );
}
