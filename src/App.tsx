import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  ShieldAlert, 
  QrCode, 
  Camera, 
  User, 
  Sparkles, 
  MessageSquare, 
  Layers, 
  Plus, 
  CheckCircle, 
  Send, 
  AlertCircle, 
  RefreshCw, 
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  QuestProject, 
  PlayerProfile, 
  LiveEvent, 
  ChatMessage, 
  QuestStep 
} from './packages/types/index';

// Admin Components
import Layout from './components/admin/Layout';
import DashboardTab from './components/admin/DashboardTab';
import QuestCreatorCMS from './components/admin/creator/QuestCreatorCMS';
import AIQuestDesignerTab from './components/admin/AIQuestDesignerTab';
import ProjectsTab from './components/admin/ProjectsTab';
import ContextTab from './components/admin/ContextTab';
import QuestsTab from './components/admin/QuestsTab';
import EventsTab from './components/admin/EventsTab';
import PlayersTab from './components/admin/PlayersTab';
import FilesTab from './components/admin/FilesTab';
import AdminSettingsTab from './components/admin/SettingsTab';

// Player PWA Components
import LandingScreen from './components/player/LandingScreen';
import BottomNav from './components/player/BottomNav';
import ChatTab from './components/player/ChatTab';
import PlayerQuestsTab from './components/player/QuestsTab';
import ProfileTab from './components/player/ProfileTab';
import AchievementsTab from './components/player/AchievementsTab';
import SettingsTab from './components/player/SettingsTab';

// Persistence Manager
import { QuestIndexedDB, OfflineAction } from './lib/indexedDb';

export default function App() {
  // Core application structures
  const [mode, setMode] = useState<'player' | 'admin'>('player');
  const [projects, setProjects] = useState<QuestProject[]>([]);
  const [selectedQuestId, setSelectedQuestId] = useState<string>('');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  
  // PWA tabs & settings
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState<'ru' | 'en'>('ru');
  
  // SSE & Offline tracking state
  const [sseConnected, setSseConnected] = useState(false);
  const [liveEventPopup, setLiveEventPopup] = useState<LiveEvent | null>(null);
  const [liveEventAnswer, setLiveEventAnswer] = useState('');
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [offlineMode, setOfflineMode] = useState(!navigator.onLine);
  const [offlineQueueLength, setOfflineQueueLength] = useState(0);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Admin Portal layout state
  const [adminActiveTab, setAdminActiveTab] = useState<string>('dashboard');

  // Load configuration & trigger offline listeners
  useEffect(() => {
    // Register PWA service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch(err => console.warn('[PWA] SW registration failed:', err));
    }

    const initApp = async () => {
      try {
        await QuestIndexedDB.init();
        await syncOfflineQueue();
      } catch (err) {
        console.warn('IndexedDB failed to init:', err);
      }
      await fetchInitialData();
    };

    initApp();
    setupSSE();

    // Listen to network status
    const handleOnline = () => {
      setOfflineMode(false);
      syncOfflineQueue();
    };
    const handleOffline = () => setOfflineMode(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update outbox indicator length periodically
  useEffect(() => {
    const checkOutbox = async () => {
      try {
        const outbox = await QuestIndexedDB.getOutbox();
        setOfflineQueueLength(outbox.length);
      } catch (err) {
        console.warn(err);
      }
    };
    checkOutbox();
    const interval = setInterval(checkOutbox, 4000);
    return () => clearInterval(interval);
  }, []);

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = mode === 'admin' 
      ? localStorage.getItem('admin_token') 
      : localStorage.getItem('player_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    } as Record<string, string>;
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return fetch(url, {
      ...options,
      headers,
    });
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Projects
      const resProj = await authFetch('/api/admin/projects');
      if (resProj.ok) {
        const dataProj = await resProj.json();
        if (Array.isArray(dataProj)) {
          setProjects(dataProj);
          // Auto select first published quest if exists
          const pubQuests = dataProj.filter((q: QuestProject) => q.status === 'published');
          if (pubQuests.length > 0) {
            setSelectedQuestId(pubQuests[0].id);
          }
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }

      // 2. Fetch Live Events
      try {
        const resLive = await authFetch('/api/admin/live-events');
        if (resLive.ok) {
          const dataLive = await resLive.json();
          if (Array.isArray(dataLive)) {
            setLiveEvents(dataLive);
          } else {
            setLiveEvents([]);
          }
        } else {
          setLiveEvents([]);
        }
      } catch (err) {
        console.warn('Could not load live-events on startup:', err);
      }

      // 3. Fetch Player profile
      const resProf = await authFetch('/api/player/profile');
      if (resProf.ok) {
        const dataProf = await resProf.json();
        setPlayerProfile(dataProf);
        await QuestIndexedDB.saveProfile(dataProf);
      }
    } catch (e) {
      console.warn('Failed to fetch from backend API. Falling back to IndexedDB local cache:', e);
      setOfflineMode(true);
      // Try to load cached profile
      const cached = await QuestIndexedDB.getProfile('player-uuid-1');
      if (cached) {
        setPlayerProfile(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshProfileSilently = async () => {
    try {
      const resProf = await authFetch('/api/player/profile');
      if (resProf.ok) {
        const dataProf = await resProf.json();
        setPlayerProfile(dataProf);
        await QuestIndexedDB.saveProfile(dataProf);
      }
    } catch (e) {
      console.warn('Silent refresh failed', e);
    }
  };

  const setupSSE = () => {
    const es = new EventSource('/api/player/events');
    
    es.onopen = () => {
      setSseConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'LIVE_EVENT') {
          setLiveEventPopup(payload.event);
          // Instantly refresh player profile to fetch the new broadcast chat message
          refreshProfileSilently();
          
          // Play notification sound
          if (notificationsEnabled) {
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
              gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.4);
            } catch (err) {
              console.warn('Could not play notification chime', err);
            }
          }
        }
      } catch (err) {
        console.error('SSE JSON parsing error:', err);
      }
    };

    es.onerror = () => {
      setSseConnected(false);
    };
  };

  // --- OFFLINE QUEUE SYNCHRONIZER ENGINE ---
  const syncOfflineQueue = async () => {
    if (navigator.onLine === false) return;
    try {
      const outbox = await QuestIndexedDB.getOutbox();
      if (outbox.length === 0) return;

      console.log(`[PWA Sync] Replaying ${outbox.length} offline actions...`);
      for (const action of outbox) {
        try {
          if (action.type === 'chat') {
            await authFetch('/api/player/chat', {
              method: 'POST',
              body: JSON.stringify({ questId: action.questId, message: action.payload.message })
            });
          } else if (action.type === 'verify-qr') {
            await authFetch('/api/player/verify-qr', {
              method: 'POST',
              body: JSON.stringify({ questId: action.questId, qrCodeValue: action.payload.qrCodeValue })
            });
          } else if (action.type === 'verify-photo') {
            await authFetch('/api/player/verify-photo', {
              method: 'POST',
              body: JSON.stringify({ questId: action.questId, photoBase64: action.payload.photoBase64 })
            });
          } else if (action.type === 'verify-location') {
            await authFetch('/api/player/verify-location', {
              method: 'POST',
              body: JSON.stringify({ questId: action.questId, lat: action.payload.lat, lng: action.payload.lng })
            });
          }
          await QuestIndexedDB.removeFromOutbox(action.id);
        } catch (syncErr) {
          console.warn('[PWA Sync] Sync item failed, keeping in outbox:', syncErr);
          break; // Stop and retry later
        }
      }
      
      // Update database profile
      const resProf = await authFetch('/api/player/profile');
      if (resProf.ok) {
        const updated = await resProf.json();
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
      }
    } catch (err) {
      console.error('[PWA Sync] Sync engine error:', err);
    }
  };

  // --- GAMEPLAY HANDLERS ---

  const handleRegisterPlayer = async (username: string) => {
    setSending(true);
    try {
      // 1. Silent registration under the hood to get a real JWT token
      const encodedName = Array.from(username).map(c => c.charCodeAt(0).toString(36)).join('');
      const cleanName = encodedName.toLowerCase().slice(0, 10) || 'player';
      const silentEmail = `${cleanName}_${Math.random().toString(36).substring(2, 10)}@aiquest.com`;
      const silentPassword = `pass_${Math.random().toString(36).substring(2, 12)}`;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: silentEmail, username, password: silentPassword })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('player_token', data.token);
        setPlayerProfile(data.profile);
        await QuestIndexedDB.saveProfile(data.profile);
        // Refresh Initial Data using the brand new token
        await fetchInitialData();
      } else {
        // Try updating profile
        const resUpdate = await authFetch('/api/player/profile/update', {
          method: 'POST',
          body: JSON.stringify({ username })
        });
        if (resUpdate.ok) {
          const data = await resUpdate.json();
          setPlayerProfile(data.profile);
          await QuestIndexedDB.saveProfile(data.profile);
        } else {
          throw new Error('Registration and profile update failed');
        }
      }
    } catch (err) {
      console.error('Offline / Fail fallback registration:', err);
      // Offline fallback: save username in local state & IndexedDB
      const offlineProfile: PlayerProfile = {
        userId: `player-${Math.random().toString(36).substring(2, 8)}`,
        username,
        level: 1,
        xp: 0,
        rank: 'Новичок',
        inventory: ['Компас'],
        achievements: ['Первый Шаг'],
        questProgress: {}
      };
      setPlayerProfile(offlineProfile);
      await QuestIndexedDB.saveProfile(offlineProfile);
    } finally {
      setSending(false);
    }
  };

  const handleJoinQuest = async (questId: string) => {
    setSending(true);
    try {
      const res = await authFetch('/api/player/join', {
        method: 'POST',
        body: JSON.stringify({ questId })
      });
      const progress = await res.json();
      
      if (playerProfile) {
        const updated = {
          ...playerProfile,
          questProgress: {
            ...playerProfile.questProgress,
            [questId]: progress
          }
        };
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
      }
    } catch (err) {
      console.warn('Quest join offline fallback:', err);
      // Simulate local join offline
      if (playerProfile) {
        const project = projects.find(p => p.id === questId);
        const progress = {
          currentStepIndex: 0,
          completed: false,
          chatHistory: [
            {
              sender: 'gamemaster' as const,
              text: `Приветствую на квесте "${project?.name || 'Испытание'}"! Я — ${project?.npcs[0]?.name || 'твой Проводник'}. Сюжет: "${project?.lore.story || 'Древние сказания...'}"`,
              timestamp: new Date().toISOString()
            }
          ]
        };
        const updated = {
          ...playerProfile,
          questProgress: {
            ...playerProfile.questProgress,
            [questId]: progress
          }
        };
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text || !selectedQuestId || !playerProfile) return;
    setSending(true);

    const progress = playerProfile.questProgress[selectedQuestId];
    if (!progress) return;

    // 1. Add player message instantly to feed
    const updatedHistory = [...(progress.chatHistory || [])];
    updatedHistory.push({
      sender: 'player',
      text,
      timestamp: new Date().toISOString()
    });

    const tempProfile = {
      ...playerProfile,
      questProgress: {
        ...playerProfile.questProgress,
        [selectedQuestId]: {
          ...progress,
          chatHistory: updatedHistory
        }
      }
    };
    setPlayerProfile(tempProfile);

    if (offlineMode) {
      // Store action in outbox queue
      await QuestIndexedDB.addToOutbox({
        type: 'chat',
        questId: selectedQuestId,
        payload: { message: text }
      });
      // Append automated offline response
      updatedHistory.push({
        sender: 'gamemaster',
        text: '⏳ Проводник услышал ваше послание! Оно будет полностью проанализировано, как только связь с космосом восстановится.',
        timestamp: new Date().toISOString()
      });
      const offlineProfile = {
        ...playerProfile,
        questProgress: {
          ...playerProfile.questProgress,
          [selectedQuestId]: {
            ...progress,
            chatHistory: updatedHistory
          }
        }
      };
      setPlayerProfile(offlineProfile);
      await QuestIndexedDB.saveProfile(offlineProfile);
      setSending(false);
      return;
    }

    try {
      const res = await authFetch('/api/player/chat', {
        method: 'POST',
        body: JSON.stringify({ questId: selectedQuestId, message: text })
      });
      const data = await res.json();
      setPlayerProfile(data.playerProfile);
      await QuestIndexedDB.saveProfile(data.playerProfile);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // --- CARD VERIFICATIONS HANDLERS ---

  const handleVerifyText = async (text: string): Promise<boolean> => {
    if (offlineMode) {
      await QuestIndexedDB.addToOutbox({
        type: 'chat',
        questId: selectedQuestId,
        payload: { message: text }
      });
      return true; // Graceful simulation success
    }

    try {
      const res = await authFetch('/api/player/chat', {
        method: 'POST',
        body: JSON.stringify({ questId: selectedQuestId, message: text })
      });
      const data = await res.json();
      if (res.ok) {
        setPlayerProfile(data.playerProfile);
        await QuestIndexedDB.saveProfile(data.playerProfile);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleVerifyQR = async (code: string): Promise<boolean> => {
    if (offlineMode) {
      await QuestIndexedDB.addToOutbox({
        type: 'verify-qr',
        questId: selectedQuestId,
        payload: { qrCodeValue: code }
      });
      return true;
    }

    try {
      const res = await authFetch('/api/player/verify-qr', {
        method: 'POST',
        body: JSON.stringify({ questId: selectedQuestId, qrCodeValue: code })
      });
      const data = await res.json();
      if (data.success) {
        const updated = data.progress ? { ...playerProfile!, questProgress: { ...playerProfile!.questProgress, [selectedQuestId]: data.progress }, level: data.playerProfile.level, xp: data.playerProfile.xp, rank: data.playerProfile.rank, inventory: data.playerProfile.inventory, achievements: data.playerProfile.achievements } : playerProfile!;
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleVerifyPhoto = async (base64: string): Promise<boolean> => {
    if (offlineMode) {
      await QuestIndexedDB.addToOutbox({
        type: 'verify-photo',
        questId: selectedQuestId,
        payload: { photoBase64: base64 }
      });
      return true;
    }

    try {
      const res = await authFetch('/api/player/verify-photo', {
        method: 'POST',
        body: JSON.stringify({ questId: selectedQuestId, photoBase64: base64 })
      });
      const data = await res.json();
      if (data.success) {
        const updated = data.progress ? { ...playerProfile!, questProgress: { ...playerProfile!.questProgress, [selectedQuestId]: data.progress }, level: data.playerProfile.level, xp: data.playerProfile.xp, rank: data.playerProfile.rank, inventory: data.playerProfile.inventory, achievements: data.playerProfile.achievements } : playerProfile!;
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleVerifyLocation = async (lat: number, lng: number): Promise<boolean> => {
    if (offlineMode) {
      await QuestIndexedDB.addToOutbox({
        type: 'verify-location',
        questId: selectedQuestId,
        payload: { lat, lng }
      });
      return true;
    }

    try {
      const res = await authFetch('/api/player/verify-location', {
        method: 'POST',
        body: JSON.stringify({ questId: selectedQuestId, lat, lng })
      });
      const data = await res.json();
      if (data.success) {
        const updated = data.progress ? { ...playerProfile!, questProgress: { ...playerProfile!.questProgress, [selectedQuestId]: data.progress }, level: data.playerProfile.level, xp: data.playerProfile.xp, rank: data.playerProfile.rank, inventory: data.playerProfile.inventory, achievements: data.playerProfile.achievements } : playerProfile!;
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleVerifyTimer = async (): Promise<boolean> => {
    try {
      const res = await authFetch('/api/player/verify-timer', {
        method: 'POST',
        body: JSON.stringify({ questId: selectedQuestId })
      });
      const data = await res.json();
      if (data.success) {
        const updated = data.progress ? { ...playerProfile!, questProgress: { ...playerProfile!.questProgress, [selectedQuestId]: data.progress }, level: data.playerProfile.level, xp: data.playerProfile.xp, rank: data.playerProfile.rank, inventory: data.playerProfile.inventory, achievements: data.playerProfile.achievements } : playerProfile!;
        setPlayerProfile(updated);
        await QuestIndexedDB.saveProfile(updated);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  const handleTimerComplete = () => {
    if (!playerProfile || !selectedQuestId) return;
    const progress = playerProfile.questProgress[selectedQuestId];
    if (progress) {
      progress.chatHistory.push({
        sender: 'system',
        text: '⏰ Священное время испытания истекло. Задание автоматически завершено Хранителем!',
        timestamp: new Date().toISOString()
      });
      setPlayerProfile({ ...playerProfile });
    }
  };

  // --- DIAGNOSTIC ACTIONS ---

  const handleClearCache = async () => {
    if (window.confirm('Очистить весь локальный кэш IndexedDB?')) {
      await QuestIndexedDB.clearAll();
      alert('Локальный кэш успешно сброшен!');
      fetchInitialData();
    }
  };

  const handleResetProfile = async () => {
    if (!window.confirm('Сбросить весь прогресс? Все предметы и опыт будут навсегда удалены с сервера.')) return;
    setSending(true);
    try {
      const res = await authFetch('/api/player/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPlayerProfile(data.player);
        await QuestIndexedDB.saveProfile(data.player);
        if (projects.length > 0) {
          handleJoinQuest(selectedQuestId || projects[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleRealLogout = () => {
    if (window.confirm('Вы действительно хотите выйти и сменить игрока?')) {
      localStorage.removeItem('player_token');
      setPlayerProfile(null);
      setActiveTab('chat');
    }
  };

  const handleSolveLiveEvent = () => {
    if (!liveEventPopup || !playerProfile) return;
    const cleanUser = liveEventAnswer.toLowerCase().trim();
    const cleanAns = (liveEventPopup.verificationData?.answers?.[0] || 'елка').toLowerCase().trim();

    if (cleanUser.includes(cleanAns) || cleanAns.includes(cleanUser)) {
      const currentProgress = playerProfile.questProgress[selectedQuestId] || { currentStepIndex: 0, completed: false, chatHistory: [] };
      currentProgress.chatHistory.push({
        sender: 'system',
        text: `🎉 LIVE-СОБЫТИЕ ПРОЙДЕНО! Получено +${liveEventPopup.reward.xp} XP и предмет: ${liveEventPopup.reward.item || 'Награда'}!`,
        timestamp: new Date().toISOString()
      });

      const newXp = playerProfile.xp + liveEventPopup.reward.xp;
      const newLvl = Math.floor(newXp / 500) + 1;
      const inv = [...playerProfile.inventory];
      if (liveEventPopup.reward.item) inv.push(liveEventPopup.reward.item);

      const updated = {
        ...playerProfile,
        xp: newXp,
        level: newLvl,
        inventory: inv,
        questProgress: {
          ...playerProfile.questProgress,
          [selectedQuestId]: currentProgress
        }
      };

      setPlayerProfile(updated);
      QuestIndexedDB.saveProfile(updated);
      alert('Правильно! Вы заслужили эту награду!');
      setLiveEventPopup(null);
      setLiveEventAnswer('');
    } else {
      alert('Неверный ответ! Попробуйте еще раз, время идет!');
    }
  };

  // Fetch contextual values
  const activeQuest = projects.find(p => p.id === selectedQuestId);
  const activeProgress = playerProfile?.questProgress[selectedQuestId];
  const activeStep: QuestStep | undefined = activeQuest?.steps?.[activeProgress?.currentStepIndex || 0];

  return (
    <div id="root-container" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden">
      
      {/* BACKGROUND ACCENTS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-sky-500/10 blur-[150px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[150px] rounded-full -z-10 pointer-events-none" />

      {/* STICKY HEADER */}
      <header className="border-b border-slate-900 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight text-white flex items-center gap-2">
                AI Quest Platform
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Real-World Gamemaster Engine</p>
            </div>
          </div>

          {/* Network Connection Status Info */}
          <div className="flex items-center gap-2 font-mono text-[10px] bg-slate-950/60 border border-slate-900 px-3 py-1.5 rounded-full">
            <span className={`w-2.5 h-2.5 rounded-full ${sseConnected && !offlineMode ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
            <span className={sseConnected && !offlineMode ? 'text-emerald-400' : 'text-amber-400'}>
              {offlineMode ? 'ОФЛАЙН РЕЖИМ' : sseConnected ? 'LIVE СВЯЗЬ АКТИВНА' : 'ПЕРЕПОДКЛЮЧЕНИЕ'}
            </span>
          </div>

          {/* Player/Admin Selector */}
          <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-900">
            <button
              id="btn-switch-player"
              onClick={() => setMode('player')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'player' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <User className="w-4 h-4" />
              Игрок (PWA)
            </button>
            <button
              id="btn-switch-admin"
              onClick={() => setMode('admin')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${mode === 'admin' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-white'}`}
            >
              <Layers className="w-4 h-4" />
              Админка
            </button>
          </div>

        </div>
      </header>

      {/* CORE FRAMEWORK CONTROLLER */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 flex flex-col justify-center">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin" />
            <p className="text-sm font-mono text-slate-400">Синхронизация таежной вселенной с IndexedDB...</p>
          </div>
        ) : mode === 'player' ? (
          
          /* ====================================================
             PLAYER PWA VIEWS FLOW
             ==================================================== */
          <div className="flex-1 flex flex-col w-full min-h-[calc(100vh-160px)] relative pb-16">
            {!playerProfile ? (
              <LandingScreen
                questName={activeQuest?.name || 'Забытые Сказания'}
                questDesc={activeQuest?.description || 'Пройдите испытания проводника в реальном мире.'}
                questStory={activeQuest?.lore.story || 'Древний артефакт в избушке внезапно ожил...'}
                onRegister={handleRegisterPlayer}
              />
            ) : (
              <div className="flex-1 flex flex-col h-full">
                
                {/* Switch between interactive bottom tabs */}
                <div className="flex-1 flex flex-col">
                  {activeTab === 'chat' && (
                    <ChatTab
                      chatHistory={activeProgress?.chatHistory || []}
                      activeStep={activeProgress?.completed ? undefined : activeStep}
                      sending={sending}
                      onSendMessage={handleSendMessage}
                      onSubmitText={handleVerifyText}
                      onSubmitQR={handleVerifyQR}
                      onSubmitPhoto={handleVerifyPhoto}
                      onSubmitLocation={handleVerifyLocation}
                      onSubmitTimer={handleVerifyTimer}
                      onTimerComplete={handleTimerComplete}
                      offlineMode={offlineMode}
                      npcName={activeQuest?.npcs[0]?.name}
                      npcAvatar={activeQuest?.npcs[0]?.avatar}
                    />
                  )}

                  {activeTab === 'tasks' && (
                    <PlayerQuestsTab
                      projects={projects}
                      playerProfile={playerProfile}
                      selectedQuestId={selectedQuestId}
                      onJoinQuest={handleJoinQuest}
                      onSelectQuest={(id) => {
                        setSelectedQuestId(id);
                        setActiveTab('chat');
                      }}
                    />
                  )}

                  {activeTab === 'profile' && (
                    <ProfileTab
                      playerProfile={playerProfile}
                      projects={projects}
                      onUpdateUsername={handleRegisterPlayer}
                      onLogout={handleRealLogout}
                    />
                  )}

                  {activeTab === 'achievements' && (
                    <AchievementsTab playerProfile={playerProfile} />
                  )}

                  {activeTab === 'settings' && (
                    <SettingsTab
                      theme={theme}
                      setTheme={setTheme}
                      notificationsEnabled={notificationsEnabled}
                      setNotificationsEnabled={setNotificationsEnabled}
                      language={language}
                      setLanguage={setLanguage}
                      onClearCache={handleClearCache}
                      onLogout={handleResetProfile}
                      sseActive={sseConnected && !offlineMode}
                      offlineQueueLength={offlineQueueLength}
                    />
                  )}
                </div>

                {/* Bottom Navigation */}
                <BottomNav
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  unreadCount={0}
                  pendingTasksCount={activeProgress && !activeProgress.completed ? 1 : 0}
                />
              </div>
            )}
          </div>
        ) : !localStorage.getItem('admin_token') ? (
          <div id="admin-login-panel" className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold font-display text-white">Вход в Админ-Панель</h2>
              <p className="text-xs text-slate-400">Используйте административные ключи доступа для управления миром квестов.</p>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;
              const password = (form.elements.namedItem('password') as HTMLInputElement).value;
              
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email, password })
                });
                if (res.ok) {
                  const data = await res.json();
                  localStorage.setItem('admin_token', data.token);
                  // Refresh data
                  await fetchInitialData();
                } else {
                  const errData = await res.json();
                  alert(errData.error || 'Ошибка авторизации');
                }
              } catch (err) {
                alert('Не удалось подключиться к серверу аутентификации.');
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Email</label>
                <input name="email" type="email" required defaultValue="admin@aiquest.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">Пароль</label>
                <input name="password" type="password" required defaultValue="123456" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
              </div>
              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl py-2.5 text-sm transition-all shadow-lg shadow-indigo-600/20">
                Войти в систему
              </button>
            </form>
            <div className="text-center pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">ДЕФОЛТНЫЕ СВЕДЕНИЯ: admin@aiquest.com / 123456</span>
            </div>
          </div>
        ) : (
          /* ====================================================
             ADMIN PORTAL INTEGRAL DOCK
             ==================================================== */
          <Layout 
            currentTab={adminActiveTab}
            setTab={setAdminActiveTab}
            theme={theme}
            setTheme={setTheme}
            onToggleMode={() => setMode('player')}
          >
            {adminActiveTab === 'dashboard' && (
              <DashboardTab 
                projects={projects} 
                players={[playerProfile].filter(Boolean) as any} 
                liveEvents={liveEvents} 
              />
            )}
            {adminActiveTab === 'quest-creator' && <QuestCreatorCMS />}
            {adminActiveTab === 'ai-designer' && (
              <AIQuestDesignerTab 
                onSaveAsDraft={(newProj) => {
                  setProjects([...projects, newProj]);
                }}
                setTab={setAdminActiveTab}
              />
            )}
            {adminActiveTab === 'projects' && <ProjectsTab projects={projects} setProjects={setProjects} />}
            {adminActiveTab === 'editor' && <ContextTab projects={projects} setProjects={setProjects} />}
            {adminActiveTab === 'quests' && <QuestsTab projects={projects} setProjects={setProjects} />}
            {adminActiveTab === 'events' && (
              <EventsTab 
                liveEvents={liveEvents} 
                setLiveEvents={setLiveEvents} 
                playersList={[playerProfile].filter(Boolean) as any} 
              />
            )}
            {adminActiveTab === 'players' && (
              <PlayersTab 
                players={[playerProfile].filter(Boolean) as any} 
                setPlayers={(updatedPlayers) => {
                  if (updatedPlayers && updatedPlayers.length > 0) {
                    setPlayerProfile(updatedPlayers[0]);
                  }
                }} 
              />
            )}
            {adminActiveTab === 'files' && <FilesTab />}
            {adminActiveTab === 'settings' && <AdminSettingsTab />}
          </Layout>
        )}
      </main>

      {/* DYNAMIC EMERGENCY LIVE-OVERLAY EVENT MODAL */}
      <AnimatePresence>
        {liveEventPopup && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-red-500 max-w-md w-full p-6 rounded-3xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl animate-pulse" />

              <div className="flex items-center gap-3 text-red-500 font-mono font-bold text-sm uppercase tracking-wider mb-3">
                <ShieldAlert className="w-5 h-5 animate-ping" />
                <span>ЭКСТРЕННОЕ LIVE СОБЫТИЕ!</span>
              </div>

              <h3 className="font-display font-bold text-xl text-white mb-2">
                {liveEventPopup.title}
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                {liveEventPopup.description}
              </p>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col gap-2 mb-4">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Поле ввода ответа:</label>
                <input
                  type="text"
                  placeholder="Введите решение загадки..."
                  value={liveEventAnswer}
                  onChange={(e) => setLiveEventAnswer(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSolveLiveEvent}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-600/15"
                >
                  Отправить решение
                </button>
                <button
                  onClick={() => setLiveEventPopup(null)}
                  className="px-4 py-2.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl"
                >
                  Пропустить
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER ACCENTS */}
      <footer className="border-t border-slate-900 bg-slate-950/80 p-4 text-center text-slate-500 text-xs font-mono mt-auto flex justify-between max-w-7xl w-full mx-auto">
        <span>© 2026 AI Quest Platform Inc. All Rights Reserved.</span>
        <span>Built with Google Gemini & Vite</span>
      </footer>

    </div>
  );
}
