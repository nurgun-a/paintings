import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  QrCode, 
  Camera, 
  User, 
  Sparkles, 
  MessageSquare, 
  Layers, 
  Radio, 
  Users, 
  Award, 
  Plus, 
  CheckCircle, 
  Send, 
  AlertCircle, 
  RefreshCw, 
  Flame,
  Zap,
  Image,
  X,
  LayoutDashboard,
  Settings,
  FolderOpen,
  BookOpen,
  UserCheck,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  currentTab: string;
  setTab: (tab: string) => void;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  onToggleMode: () => void;
}

export default function AdminLayout({ 
  currentTab, 
  setTab, 
  children, 
  theme, 
  setTheme,
  onToggleMode
}: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Панель управления', icon: LayoutDashboard, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'quest-creator', label: 'Quest Creator (No-Code)', icon: Sparkles, color: 'text-indigo-400 bg-indigo-400/10' },
    { id: 'ai-designer', label: 'AI Quest Designer', icon: Bot, color: 'text-pink-500 bg-pink-500/10' },
    { id: 'projects', label: 'Управление проектами', icon: Layers, color: 'text-indigo-500 bg-indigo-500/10' },
    { id: 'editor', label: 'Редактор контекста', icon: BookOpen, color: 'text-pink-500 bg-pink-500/10' },
    { id: 'quests', label: 'Квесты и этапы', icon: Compass, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'events', label: 'LIVE События', icon: Radio, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'players', label: 'Игроки и чаты', icon: Users, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'files', label: 'Файловый менеджер', icon: FolderOpen, color: 'text-cyan-500 bg-cyan-500/10' },
    { id: 'settings', label: 'Настройки платформы', icon: Settings, color: 'text-purple-500 bg-purple-500/10' }
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0f111a] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} id="admin-root">
      
      {/* SIDEBAR */}
      <aside className={`flex flex-col border-r transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-72'
      } ${
        theme === 'dark' ? 'bg-[#151824] border-slate-800' : 'bg-white border-slate-200'
      }`} id="admin-sidebar">
        {/* LOGO */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-inherit">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-bold tracking-tight text-lg bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent truncate"
              >
                Quest Admin
              </motion.div>
            )}
          </div>
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={`p-1.5 rounded-lg hover:bg-slate-500/10 transition-colors ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* MENU */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl font-medium text-sm transition-all relative group ${
                  isActive 
                    ? theme === 'dark' 
                      ? 'bg-slate-800 text-indigo-400 shadow-inner' 
                      : 'bg-indigo-50 text-indigo-600'
                    : theme === 'dark'
                      ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                id={`sidebar-tab-${item.id}`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-indigo-500"
                  />
                )}
                <div className={`p-1.5 rounded-lg shrink-0 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {!collapsed && (
                  <span className="truncate transition-transform group-hover:translate-x-0.5 duration-200">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* BOTTOM UTILITY / PWA SWITCHER */}
        <div className="p-4 border-t border-inherit space-y-3">
          {!collapsed && (
            <button 
              onClick={onToggleMode}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-pink-500 text-white rounded-xl text-xs font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              id="switch-to-player"
            >
              <Laptop className="w-4 h-4" />
              <span>Режим игрока (PWA)</span>
            </button>
          )}
          <div className="flex items-center justify-around gap-2 bg-slate-500/5 py-1.5 px-2 rounded-xl">
            <button 
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-lg ${theme === 'light' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Светлая тема"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-slate-600'}`}
              title="Темная тема"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${
          theme === 'dark' ? 'bg-[#151824] border-slate-800' : 'bg-white border-slate-200'
        }`} id="admin-header">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight">Панель организатора</h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Сервер Live
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <div className="text-xs text-slate-500 font-mono">Текущее время</div>
              <div className="text-sm font-semibold">{new Date().toLocaleTimeString()}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold border border-indigo-500/20">
              A
            </div>
          </div>
        </header>

        {/* CONTAINER CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
