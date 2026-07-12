import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { QuestProvider, useQuest } from './context/QuestContext';
import { Register } from './pages/Register';
import { QuestView } from './pages/QuestView';
import { ChatView } from './pages/ChatView';
import { ProfileView } from './pages/ProfileView';
import { ProgressView } from './pages/ProgressView';
import { FinishView } from './pages/FinishView';
import { NotFound } from './pages/NotFound';
import { 
  Home as HomeIcon, MapPin, MessageCircle, User, Trophy, Compass, 
  Menu, Sun, Moon, Sparkles, Award 
} from 'lucide-react';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, progress, tasks, theme, toggleTheme } = useQuest();
  const location = useLocation();
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Redirect if not registered
  useEffect(() => {
    if (profile && !profile.registered && location.pathname !== '/register') {
      navigate('/register');
    }
  }, [profile, location, navigate]);

  const isRegistered = profile?.registered;
  const currentPath = location.pathname;

  const totalTasks = tasks.length;
  const completedCount = progress.completedTaskIds.length;
  const isQuestFinished = completedCount === totalTasks && totalTasks > 0;

  // Render bottom navigation item
  const renderNavItem = (to: string, icon: React.ReactNode, label: string, badge?: number | string) => {
    const isActive = currentPath === to;
    return (
      <Link
        to={to}
        className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all ${
          isActive
            ? theme === 'dark' 
              ? 'text-cyan-400 font-extrabold scale-105' 
              : 'text-cyan-600 font-extrabold scale-105'
            : 'text-slate-400 dark:text-zinc-500 hover:text-cyan-600 dark:hover:text-cyan-400'
        }`}
      >
        <div className="relative">
          {icon}
          {badge !== undefined && badge !== 0 && (
            <span className="absolute -top-1.5 -right-2 bg-cyan-500 text-black text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center font-mono">
              {badge}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-1 font-sans font-bold tracking-tight">{label}</span>
      </Link>
    );
  };

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'dark bg-[#09090b] text-slate-200' : 'bg-slate-50 text-slate-800'
    } flex flex-col transition-colors duration-300 font-sans`}>
      
      {/* Header Panel */}
      {isRegistered && (
        <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#18181b]/90 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/80 shadow-sm px-4 py-3.5 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-2 rounded-xl text-cyan-600 dark:text-cyan-400 shadow-sm">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold font-sans tracking-tight text-slate-900 dark:text-white">
                Тайны Старого Города
              </h1>
              <p className="text-[9px] text-cyan-600 dark:text-cyan-400/80 font-mono tracking-wider uppercase font-bold">
                Городской Квест-Платформа
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Top Quick Status Badge */}
            <div className="hidden xs:flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700/60 text-slate-700 dark:text-slate-200 text-[11px] px-2.5 py-1 rounded-full font-mono">
              <Trophy className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
              <span>{completedCount}/{totalTasks}</span>
            </div>

            {/* Light/Dark Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 transition-all cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-cyan-600" />}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className={`flex-1 ${isRegistered ? 'p-4 max-w-2xl w-full mx-auto' : ''}`}>
        {children}
      </main>

      {/* Fixed Bottom Navigation Menu Bar */}
      {isRegistered && (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800/80 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.4)] px-3 py-2 flex items-center justify-around transition-colors">
          {renderNavItem('/', <Compass className="w-5 h-5" />, 'Задания')}
          {renderNavItem('/chat', <MessageCircle className="w-5 h-5" />, 'Чат ИИ')}
          {renderNavItem('/progress', <Trophy className="w-5 h-5" />, 'Прогресс', isQuestFinished ? '🏆' : undefined)}
          {renderNavItem('/profile', <User className="w-5 h-5" />, 'Профиль')}
        </nav>
      )}

      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 text-cyan-600 dark:text-cyan-400 text-xs px-4 py-2.5 rounded-2xl shadow-2xl font-bold flex items-center gap-2 border-cyan-500/10">
          <Trophy className="w-4 h-4 text-cyan-500" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <QuestProvider>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<QuestView />} />
            <Route path="/chat" element={<ChatView />} />
            <Route path="/progress" element={<ProgressView />} />
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/finish" element={<FinishView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </QuestProvider>
  );
}
