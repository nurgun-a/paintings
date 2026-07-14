import React, { createContext, useContext, useState, useEffect } from 'react';
import { PlayerProfile, QuestProgress, QuestTask, ChatMessage } from '../types';

export interface CustomConfig {
  questName: string;
  backgrounds: {
    mainBackgroundUrl: string;
    mainBackgroundFallback: string;
    sargeWoodColorLight: string;
    sargeWoodColorMedium: string;
    sargeWoodColorDark: string;
    trailPrimaryColor: string;
    trailDottedColor: string;
  };
  customImages: {
    sargeActiveImage: string;
    sargeCompletedImage: string;
    sargeLockedImage: string;
    generalSargeImage: string;
  };
  customIcons: {
    active: string;
    completed: string;
    locked: string;
  };
}

export interface AccentColorPalette {
  id: string;
  name: string;
  description: string;
  colors: {
    '400': string;
    '500': string;
    '550': string;
    '600': string;
  };
}

export const ACCENT_PALETTES: AccentColorPalette[] = [
  {
    id: 'wood',
    name: 'Берестяной покой (Коричневый)',
    description: 'Древесно-коричневые тона древней березы, священных Сэргэ и якутской тайги.',
    colors: {
      '400': '#c27a3f', // Light copper/leather
      '500': '#a35c27', // Warm Amber/Brown
      '550': '#874618', // Deep wood
      '600': '#6e350f', // Dark bark wood
    }
  },
  {
    id: 'amber',
    name: 'Золото Айыы (Янтарный)',
    description: 'Благословенный свет Верхнего Мира, тепло очага и сияние золота Саха.',
    colors: {
      '400': '#f59e0b', // Amber 500
      '500': '#d97706', // Amber 600
      '550': '#b45309', // Amber 700
      '600': '#78350f', // Amber 900
    }
  },
  {
    id: 'terracotta',
    name: 'Огонь очага (Терракотовый)',
    description: 'Глиняные предания, тепло костра под созвездиями и отвага богатырей.',
    colors: {
      '400': '#fb923c', // Orange 400
      '500': '#ea580c', // Orange 600
      '550': '#c2410c', // Orange 700
      '600': '#9a3412', // Orange 900
    }
  },
  {
    id: 'forest',
    name: 'Шёпот тайги (Зеленый)',
    description: 'Мудрость древних кедров, благословение Иччи и вечнозеленая сила природы Саха.',
    colors: {
      '400': '#4ade80', // Green 400
      '500': '#16a34a', // Green 600
      '550': '#15803d', // Green 700
      '600': '#166534', // Green 800
    }
  },
  {
    id: 'sky',
    name: 'Ледяной Ленский (Синий)',
    description: 'Холодная сила реки Лены, дыхание зимней стужи и чистое небо над Якутией.',
    colors: {
      '400': '#22d3ee', // Cyan 400
      '500': '#0891b2', // Cyan 600
      '550': '#0369a1', // Sky 700
      '600': '#0e7490', // Cyan 800
    }
  }
];

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
  triggerSpiritGreeting: (hiddenPrompt: string) => Promise<void>;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isChatLoading: boolean;
  activatedTaskId: number | null;
  setActivatedTaskId: (id: number | null) => void;
  customConfig: CustomConfig | null;
  accentColor: string;
  setAccentColor: (color: string) => void;
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

const safeSaveToLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Failed to save to localStorage for key "${key}":`, e);
    // If it's progress, prune heavy media strings
    if (key === 'quest_progress') {
      try {
        const parsed = JSON.parse(value);
        const prunedPhotos = { ...parsed.photos };
        const prunedAudios = { ...parsed.audios };
        const prunedVideos = { ...parsed.videos };

        Object.keys(prunedPhotos).forEach(k => {
          const numKey = Number(k);
          if (prunedPhotos[numKey] && prunedPhotos[numKey].length > 10000) {
            prunedPhotos[numKey] = "[Фото сохранено в памяти сессии, но не в кэше браузера из-за ограничений размера]";
          }
        });
        Object.keys(prunedAudios).forEach(k => {
          const numKey = Number(k);
          if (prunedAudios[numKey] && prunedAudios[numKey].length > 10000) {
            prunedAudios[numKey] = "[Аудио сохранено в памяти сессии, но не в кэше браузера из-за ограничений размера]";
          }
        });
        Object.keys(prunedVideos).forEach(k => {
          const numKey = Number(k);
          if (prunedVideos[numKey] && prunedVideos[numKey].length > 10000) {
            prunedVideos[numKey] = "[Видео сохранено в памяти сессии, но не в кэше браузера из-за ограничений размера]";
          }
        });

        const prunedProgress = {
          ...parsed,
          photos: prunedPhotos,
          audios: prunedAudios,
          videos: prunedVideos
        };
        localStorage.setItem(key, JSON.stringify(prunedProgress));
        console.log(`Successfully saved pruned version of quest_progress to localStorage.`);
      } catch (innerError) {
        console.error('Failed to save even pruned progress to localStorage:', innerError);
      }
    } else if (key === 'quest_chat_history') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length > 20) {
          const trimmed = [parsed[0], ...parsed.slice(-15)]; // Keep welcome msg and last 15 messages
          localStorage.setItem(key, JSON.stringify(trimmed));
          console.log(`Successfully saved trimmed chat history to localStorage.`);
        }
      } catch (innerError) {
        console.error('Failed to save trimmed chat history to localStorage:', innerError);
      }
    }
  }
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
  const [activatedTaskId, setActivatedTaskIdState] = useState<number | null>(null);
  const [customConfig, setCustomConfig] = useState<CustomConfig | null>(null);
  const [accentColor, setAccentColorState] = useState<string>(() => {
    return localStorage.getItem('quest_accent_color') || 'wood';
  });

  const setAccentColor = (color: string) => {
    setAccentColorState(color);
    safeSaveToLocalStorage('quest_accent_color', color);
  };

  useEffect(() => {
    const palette = ACCENT_PALETTES.find(p => p.id === accentColor) || ACCENT_PALETTES[0];
    const root = document.documentElement;
    root.style.setProperty('--color-brand-400', palette.colors['400']);
    root.style.setProperty('--color-brand-500', palette.colors['500']);
    root.style.setProperty('--color-brand-550', palette.colors['550']);
    root.style.setProperty('--color-brand-600', palette.colors['600']);
  }, [accentColor]);

  const setActivatedTaskId = (id: number | null) => {
    setActivatedTaskIdState(id);
    if (id !== null) {
      safeSaveToLocalStorage('quest_activated_task_id', id.toString());
    } else {
      localStorage.removeItem('quest_activated_task_id');
    }
  };

  const setFocusedTaskId = (id: number) => {
    setFocusedTaskIdState(id);
    safeSaveToLocalStorage('quest_focused_task_id', id.toString());
  };

  // Initialize and load from LocalStorage
  useEffect(() => {
    const initData = async () => {
      try {
        // Load profile safely
        try {
          const storedProfile = localStorage.getItem('quest_player_profile');
          if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
          }
        } catch (e) {
          console.warn('Failed to parse quest_player_profile from localStorage', e);
          localStorage.removeItem('quest_player_profile');
        }

        // Load progress safely
        try {
          const storedProgress = localStorage.getItem('quest_progress');
          if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            const mergedProgress = {
              ...DEFAULT_PROGRESS,
              ...parsed,
              completedTaskIds: parsed?.completedTaskIds || [],
              answers: parsed?.answers || {},
              photos: parsed?.photos || {},
              audios: parsed?.audios || {},
              videos: parsed?.videos || {}
            };
            setProgress(mergedProgress);
            
            // Set focused task from saved state, fallback to current incomplete task
            const storedFocusedId = localStorage.getItem('quest_focused_task_id');
            if (storedFocusedId) {
              setFocusedTaskIdState(parseInt(storedFocusedId, 10));
            } else {
              setFocusedTaskIdState(mergedProgress.currentTaskId || 1);
            }
          } else {
            setFocusedTaskIdState(1);
          }
        } catch (e) {
          console.warn('Failed to parse quest_progress from localStorage', e);
          localStorage.removeItem('quest_progress');
          localStorage.removeItem('quest_focused_task_id');
          setProgress(DEFAULT_PROGRESS);
          setFocusedTaskIdState(1);
        }

        // Load chat history safely
        const welcomeMsg: ChatMessage = {
          id: 'welcome',
          sender: 'ai',
          text: 'Приветствую тебя, славный богатырь! Я — твой Сказитель Олонхо (Олонхосут). Я буду вести тебя сквозь три великих мира якутского эпоса «Ньургун Стремительный». Задавай мне любые вопросы — я могу рассказать древние предания и дать тебе мудрые наводящие подсказки к испытаниям, но разгадать тайны и спасти Туйаарыму Куо тебе предстоит своими силами!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        try {
          const storedChat = localStorage.getItem('quest_chat_history');
          if (storedChat) {
            setChatMessages(JSON.parse(storedChat));
          } else {
            setChatMessages([welcomeMsg]);
            safeSaveToLocalStorage('quest_chat_history', JSON.stringify([welcomeMsg]));
          }
        } catch (e) {
          console.warn('Failed to parse quest_chat_history from localStorage', e);
          setChatMessages([welcomeMsg]);
          safeSaveToLocalStorage('quest_chat_history', JSON.stringify([welcomeMsg]));
        }

        // Load theme
        const storedTheme = localStorage.getItem('quest_theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
          setTheme(storedTheme);
          document.documentElement.classList.toggle('dark', storedTheme === 'dark');
        } else {
          document.documentElement.classList.add('dark');
        }

        // Load activatedTaskId
        const storedActivatedId = localStorage.getItem('quest_activated_task_id');
        if (storedActivatedId) {
          setActivatedTaskIdState(parseInt(storedActivatedId, 10));
        } else {
          setActivatedTaskIdState(1); // Default to task 1
          safeSaveToLocalStorage('quest_activated_task_id', '1');
        }

        // Load custom_config.json
        try {
          const configRes = await fetch('/data/custom_config.json');
          if (configRes.ok) {
            const configData = await configRes.json();
            setCustomConfig(configData);
          }
        } catch (e) {
          console.warn('Failed to load custom config from /data/custom_config.json, using defaults', e);
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
    safeSaveToLocalStorage('quest_player_profile', JSON.stringify(p));
  };

  const updateProfile = (updated: PlayerProfile) => {
    setProfile(updated);
    safeSaveToLocalStorage('quest_player_profile', JSON.stringify(updated));
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

      safeSaveToLocalStorage('quest_progress', JSON.stringify(newProgress));

      // Clear activated task so user can activate the next one when they want
      setActivatedTaskIdState(null);
      localStorage.removeItem('quest_activated_task_id');

      // Automatically select the next uncompleted task as the focus task
      const firstUncompleted = tasks.find(t => !updatedCompleted.includes(t.id));
      if (firstUncompleted) {
        setFocusedTaskIdState(firstUncompleted.id);
        safeSaveToLocalStorage('quest_focused_task_id', firstUncompleted.id.toString());
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
          safeSaveToLocalStorage('quest_chat_history', JSON.stringify(nextChats));
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
    safeSaveToLocalStorage('quest_progress', JSON.stringify(freshProgress));
    setFocusedTaskIdState(1);
    safeSaveToLocalStorage('quest_focused_task_id', '1');
    setActivatedTaskIdState(1);
    safeSaveToLocalStorage('quest_activated_task_id', '1');

    const welcomeMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: 'ai',
      text: 'Путь Олонхо очищен от былых следов. Древние предания о Ньургуне Стремительном снова ждут тебя! С какого испытания начнем наше великое сказание?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages([welcomeMsg]);
    safeSaveToLocalStorage('quest_chat_history', JSON.stringify([welcomeMsg]));
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
    safeSaveToLocalStorage('quest_chat_history', JSON.stringify(updatedChats));

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
          history: updatedChats.slice(-30), // send last 30 messages for rich memory context
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
        safeSaveToLocalStorage('quest_chat_history', JSON.stringify(finalChats));
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
        safeSaveToLocalStorage('quest_chat_history', JSON.stringify(finalChats));
        return finalChats;
      });
    } finally {
      setIsChatLoading(false);
    }
  };

  // Automated trigger from Spirit Ichchi (e.g., welcome back or inactivity nudge)
  const triggerSpiritGreeting = async (hiddenPrompt: string) => {
    if (isChatLoading) return;
    setIsChatLoading(true);

    try {
      const activeTask = tasks.find(t => t.id === focusedTaskId) || currentTask;
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: hiddenPrompt,
          history: chatMessages.slice(-30),
          currentTask: activeTask || currentTask,
          playerName: profile ? `${profile.firstName} (${profile.username})` : 'Игрок'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.text || 'Я бодрствую и созерцаю твой путь, богатырь!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatMessages(prev => {
          const finalChats = [...prev, aiMsg];
          safeSaveToLocalStorage('quest_chat_history', JSON.stringify(finalChats));
          return finalChats;
        });
      }
    } catch (err) {
      console.error('Failed to trigger spirit greeting:', err);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Toggle dark/light mode
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    safeSaveToLocalStorage('quest_theme', newTheme);
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
      triggerSpiritGreeting,
      theme,
      toggleTheme,
      isChatLoading,
      activatedTaskId,
      setActivatedTaskId,
      customConfig,
      accentColor,
      setAccentColor
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
