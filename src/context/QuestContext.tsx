import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlayerProfile, QuestProgress, QuestTask, ChatMessage } from '../types';

interface QuestContextType {
  profile: PlayerProfile | null;
  progress: QuestProgress;
  tasks: QuestTask[];
  currentTask: QuestTask | undefined;
  focusedTaskId: number;
  setFocusedTaskId: (id: number) => void;
  loading: boolean;
  error: string | null;
  chatMessages: ChatMessage[];
  registerPlayer: (p: Omit<PlayerProfile, 'registered'>) => void;
  updateProfile: (p: PlayerProfile) => void;
  completeCurrentTask: (answer?: string, mediaData?: { photo?: string; audio?: string; video?: string }) => void;
  completeTask: (taskId: number, answer?: string, mediaData?: { photo?: string; audio?: string; video?: string }) => void;
  resetQuest: () => void;
  sendChatMessage: (text: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isChatLoading: boolean;
}

const QuestContext = createContext<QuestContextType | undefined>(undefined);

const DEFAULT_PROGRESS: QuestProgress = {
  currentTaskId: 1,
  completedTaskIds: [],
  answers: {},
  photos: {},
  audios: {},
  videos: {}
};

export const QuestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<QuestProgress>(DEFAULT_PROGRESS);
  const [tasks, setTasks] = useState<QuestTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark'); // elegant default is dark
  const [focusedTaskId, setFocusedTaskIdState] = useState<number>(1);

  const setFocusedTaskId = (id: number) => {
    setFocusedTaskIdState(id);
    localStorage.setItem('quest_focused_task_id', id.toString());
  };

  // Initialize and load from LocalStorage
  useEffect(() => {
    const initData = async () => {
      try {
        // Load profile
        const storedProfile = localStorage.getItem('quest_player_profile');
        if (storedProfile) {
          setProfile(JSON.parse(storedProfile));
        }

        // Load progress
        const storedProgress = localStorage.getItem('quest_progress');
        if (storedProgress) {
          const parsed = JSON.parse(storedProgress);
          setProgress(parsed);
          
          // Set focused task from saved state, fallback to current incomplete task
          const storedFocusedId = localStorage.getItem('quest_focused_task_id');
          if (storedFocusedId) {
            setFocusedTaskIdState(parseInt(storedFocusedId, 10));
          } else {
            setFocusedTaskIdState(parsed.currentTaskId || 1);
          }
        } else {
          setFocusedTaskIdState(1);
        }

        // Load chat history
        const storedChat = localStorage.getItem('quest_chat_history');
        if (storedChat) {
          setChatMessages(JSON.parse(storedChat));
        } else {
          // Welcome message from AI Guardian
          const welcomeMsg: ChatMessage = {
            id: 'welcome',
            sender: 'ai',
            text: 'Приветствую тебя, отважный исследователь! Я — Хранитель Тайн. Буду сопровождать тебя на пути к разгадке Тайн Старого Города. Задавай мне любые вопросы — я могу дать тебе ценные подсказки к любому заданию, но ответ тебе придется найти самостоятельно!',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setChatMessages([welcomeMsg]);
          localStorage.setItem('quest_chat_history', JSON.stringify([welcomeMsg]));
        }

        // Load theme
        const storedTheme = localStorage.getItem('quest_theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
          document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        } else {
          document.documentElement.classList.add('dark');
        }

        // Load quest configurations from JSON
        const response = await fetch('/data/quest.json');
        if (!response.ok) {
          throw new Error('Не удалось загрузить данные квеста. Проверьте public/data/quest.json');
        }
        const data = await response.json();
        setTasks(data.tasks || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  // Sync profile to localStorage
  const registerPlayer = (newProfile: Omit<PlayerProfile, 'registered'>) => {
    const p: PlayerProfile = { ...newProfile, registered: true };
    setProfile(p);
    localStorage.setItem('quest_player_profile', JSON.stringify(p));
  };

  const updateProfile = (updated: PlayerProfile) => {
    setProfile(updated);
    localStorage.setItem('quest_player_profile', JSON.stringify(updated));
  };

  const currentTask = tasks.find(t => t.id === progress.currentTaskId);

  // Mark specific task as complete
  const completeTask = (
    taskId: number,
    answer?: string,
    mediaData?: { photo?: string; audio?: string; video?: string }
  ) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    setProgress(prev => {
      const updatedCompleted = [...prev.completedTaskIds];
      if (!updatedCompleted.includes(taskId)) {
        updatedCompleted.push(taskId);
      }

      const updatedAnswers = { ...prev.answers };
      if (answer) {
        updatedAnswers[taskId] = answer;
      }

      const updatedPhotos = { ...prev.photos };
      if (mediaData?.photo) {
        updatedPhotos[taskId] = mediaData.photo;
      }

      const updatedAudios = { ...prev.audios };
      if (mediaData?.audio) {
        updatedAudios[taskId] = mediaData.audio;
      }

      const updatedVideos = { ...prev.videos };
      if (mediaData?.video) {
        updatedVideos[taskId] = mediaData.video;
      }

      const isFinished = updatedCompleted.length === tasks.length;

      // Determine next task ID
      const currentIndex = tasks.findIndex(t => t.id === taskId);
      const nextTask = tasks[currentIndex + 1];
      let nextTaskId = prev.currentTaskId;

      // If we completed the linear next task, advance currentTaskId to the first uncompleted task
      if (taskId === prev.currentTaskId) {
        const firstUncompleted = tasks.find(t => !updatedCompleted.includes(t.id));
        nextTaskId = firstUncompleted ? firstUncompleted.id : tasks.length + 1;
      }

      const newProgress: QuestProgress = {
        ...prev,
        currentTaskId: nextTaskId,
        completedTaskIds: updatedCompleted,
        answers: updatedAnswers,
        photos: updatedPhotos,
        audios: updatedAudios,
        videos: updatedVideos,
        finishedAt: isFinished ? new Date().toISOString() : prev.finishedAt,
        startedAt: prev.startedAt || new Date().toISOString()
      };

      localStorage.setItem('quest_progress', JSON.stringify(newProgress));

      // Automatically select the next uncompleted task as the focus task
      const firstUncompleted = tasks.find(t => !updatedCompleted.includes(t.id));
      if (firstUncompleted) {
        setFocusedTaskIdState(firstUncompleted.id);
        localStorage.setItem('quest_focused_task_id', firstUncompleted.id.toString());
      }

      // Send confirmation in Chat from AI Guardian
      setTimeout(() => {
        const confirmMsg: ChatMessage = {
          id: `sys-complete-${taskId}-${Date.now()}`,
          sender: 'ai',
          text: `🎉 Поздравляю! Вы успешно справились с заданием "${targetTask.title}"! ${targetTask.successMessage || ''} ${
            isFinished 
              ? 'Вы завершили все испытания квеста! Вы можете просмотреть результаты во вкладке "Прогресс".' 
              : firstUncompleted ? `Следующая рекомендуемая цель: "${firstUncompleted.title}".` : ''
          }`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(c => {
          const nextChats = [...c, confirmMsg];
          localStorage.setItem('quest_chat_history', JSON.stringify(nextChats));
          return nextChats;
        });
      }, 500);

      return newProgress;
    });
  };

  const completeCurrentTask = (
    answer?: string,
    mediaData?: { photo?: string; audio?: string; video?: string }
  ) => {
    completeTask(progress.currentTaskId, answer, mediaData);
  };

  // Reset progress and chat history
  const resetQuest = () => {
    const freshProgress: QuestProgress = {
      currentTaskId: 1,
      completedTaskIds: [],
      answers: {},
      photos: {},
      audios: {},
      videos: {}
    };
    setProgress(freshProgress);
    localStorage.setItem('quest_progress', JSON.stringify(freshProgress));
    setFocusedTaskIdState(1);
    localStorage.setItem('quest_focused_task_id', '1');

    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'ai',
      text: 'Прогресс квеста сброшен. Тайны Старого Города снова ждут тебя! Чем я могу помочь тебе на первом этапе?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([welcomeMsg]);
    localStorage.setItem('quest_chat_history', JSON.stringify([welcomeMsg]));
  };

  // Chat with AI assistant
  const sendChatMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'player',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedChats = [...chatMessages, userMsg];
    setChatMessages(updatedChats);
    localStorage.setItem('quest_chat_history', JSON.stringify(updatedChats));

    // Auto-answering check for Riddle or QR codes in Chat
    const activeTask = tasks.find(t => t.id === focusedTaskId) || currentTask;
    let matchedAnswer = false;

    if (activeTask && !progress.completedTaskIds.includes(activeTask.id)) {
      if (activeTask.type === 'riddle' || activeTask.type === 'qrcode') {
        const cleanMsg = text.trim().toLowerCase();
        const possibleAnswers = activeTask.answers?.map(a => a.trim().toLowerCase()) || [];

        const match = possibleAnswers.some(ans => {
          if (cleanMsg === ans) return true;
          if (ans.length > 2) {
            const regex = new RegExp(`\\b${ans}\\b`, 'i');
            return regex.test(cleanMsg) || cleanMsg.includes(ans);
          }
          return false;
        });

        if (match) {
          matchedAnswer = true;
          completeTask(activeTask.id, text.trim());
          return; // Skip server API call to prevent redundant guidance
        }
      }
    }

    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          history: updatedChats.slice(-8), // send last few messages for memory context
          currentTask: activeTask || currentTask,
          playerName: profile ? `${profile.firstName} (${profile.username})` : 'Игрок'
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка связи с Хранителем Тайн');
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || 'Прости, путник, мои мысли затуманились. Повтори свой вопрос.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => {
        const finalChats = [...prev, aiMsg];
        localStorage.setItem('quest_chat_history', JSON.stringify(finalChats));
        return finalChats;
      });
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: 'К сожалению, связь прервалась. Возможно, древние силы мешают нашему диалогу. Попробуйте еще раз позже.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => {
        const finalChats = [...prev, errMsg];
        localStorage.setItem('quest_chat_history', JSON.stringify(finalChats));
        return finalChats;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  // Toggle dark/light mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('quest_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <QuestContext.Provider value={{
      profile,
      progress,
      tasks,
      currentTask,
      focusedTaskId,
      setFocusedTaskId,
      loading,
      error,
      chatMessages,
      registerPlayer,
      updateProfile,
      completeCurrentTask,
      completeTask,
      resetQuest,
      sendChatMessage,
      theme,
      toggleTheme,
      isChatLoading
    }}>
      {children}
    </QuestContext.Provider>
  );
};

export const useQuest = () => {
  const context = useContext(QuestContext);
  if (context === undefined) {
    throw new Error('useQuest must be used within a QuestProvider');
  }
  return context;
};
