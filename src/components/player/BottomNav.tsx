import React from 'react';
import { MessageSquare, CheckSquare, User, Award, Settings } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadCount?: number;
  pendingTasksCount?: number;
}

export default function BottomNav({ activeTab, setActiveTab, unreadCount = 0, pendingTasksCount = 0 }: BottomNavProps) {
  const tabs = [
    { id: 'chat', label: 'Чат', icon: MessageSquare, badge: unreadCount },
    { id: 'tasks', label: 'Задания', icon: CheckSquare, badge: pendingTasksCount },
    { id: 'profile', label: 'Профиль', icon: User },
    { id: 'achievements', label: 'Награды', icon: Award },
    { id: 'settings', label: 'Опции', icon: Settings }
  ];

  return (
    <nav id="mobile-bottom-navigation" className="fixed bottom-0 left-0 right-0 bg-slate-950/90 border-t border-slate-900 backdrop-blur-lg px-2 pb-safe pt-2 z-40">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 relative transition-all"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-sky-500/15 text-sky-400 scale-110' : 'text-slate-400 hover:text-slate-200'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[9px] font-medium font-sans mt-0.5 tracking-tight ${isActive ? 'text-sky-400' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute top-1 right-1/4 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full scale-90 animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
