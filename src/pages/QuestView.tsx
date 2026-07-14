import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import { motion, AnimatePresence } from 'motion/react';
import { getDistanceInMeters } from '../utils/geo';
import { QRScanner } from '../components/QRScanner';
import { 
  Compass, Sparkles, MapPin, Volume2, Camera, Video, Award, 
  HelpCircle, CheckCircle2, RefreshCw, Mic, Square, Play, 
  Pause, Upload, QrCode, AlertTriangle, ChevronRight, Eye, Lock,
  X, Send, User, MessageCircle, MessageSquare, Map, Clock
} from 'lucide-react';

const HorseIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18c0-1.5 1-3.5 2.5-4.5C7 12.5 8 11.5 8 10c0-.8 0-1.8-.4-2.2C6.8 7 5.8 6.5 5.8 6.5s1.8-.8 3 0c1 .6 1.6 1.8 1.6 3v.5c0 .6.4 1.1 1 1.3 1.2.4 2 .9 2.4 2 1 2.2-1 4.7-3.4 4.7H3z" />
    <path d="M11 14.5h6.5l2 3.5h-13" />
    <path d="M8 18v3" />
    <path d="M12 18v3" />
    <path d="M16 18v3" />
    <path d="M7 6.5s-.5-1.5 0-2 1 .5.5 1.5" />
  </svg>
);

export const QuestView: React.FC = () => {
  const { 
    profile, progress, tasks, currentTask, focusedTaskId, setFocusedTaskId, completeTask, loading, error, resetQuest, theme, activatedTaskId, setActivatedTaskId, customConfig
  } = useQuest();
  const navigate = useNavigate();

  // Route protection
  useEffect(() => {
    if (!profile?.registered) {
      navigate('/register');
    }
  }, [profile, navigate]);

  // Determine active focused task
  const activeTask = tasks.find(t => t.id === focusedTaskId) || currentTask;

  // UI state
  const [textAnswer, setTextAnswer] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Modal & Navigation States
  const { chatMessages, sendChatMessage, isChatLoading } = useQuest();
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<any | null>(null);
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [showActivationWarning, setShowActivationWarning] = useState<boolean>(false);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<'info' | 'chat'>('info');
  const [modalChatInput, setModalChatInput] = useState('');
  const modalChatEndRef = useRef<HTMLDivElement | null>(null);

  // Automatically scroll to bottom of modal chat
  useEffect(() => {
    if (showHint && modalChatEndRef.current) {
      setTimeout(() => {
        modalChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [showHint, chatMessages, isChatLoading]);

  // Sync states when a task modal is opened
  useEffect(() => {
    if (selectedTaskForModal) {
      const isCompleted = progress.completedTaskIds.includes(selectedTaskForModal.id);
      setIsActivated(isCompleted || activatedTaskId === selectedTaskForModal.id);
      setIsChatExpanded(false);
      setShowActivationWarning(false);
      setModalTab('info');
      // Align global focus with this task so AI chatbot understands context
      setFocusedTaskId(selectedTaskForModal.id);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedTaskForModal, progress.completedTaskIds, activatedTaskId, setFocusedTaskId]);

  const handleActivateTask = () => {
    if (activatedTaskId !== null && activatedTaskId !== selectedTaskForModal?.id) {
      setShowActivationWarning(true);
    } else {
      setActivatedTaskId(selectedTaskForModal?.id);
      setIsActivated(true);
    }
  };

  const handleModalSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalChatInput.trim() || isChatLoading) return;
    const msg = modalChatInput;
    setModalChatInput('');
    await sendChatMessage(msg);
  };
  
  // Geolocation states
  const [userLocation, setUserLocation] = useState<GeolocationPosition | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoChecking, setGeoChecking] = useState(false);
  const [simulatedLat, setSimulatedLat] = useState<string>('');
  const [simulatedLon, setSimulatedLon] = useState<string>('');

  // Audio / Video media recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [videoBase64, setVideoBase64] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Photo uploading states
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isVisionScanning, setIsVisionScanning] = useState(false);
  const [visionScanPercent, setVisionScanPercent] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPlayRef = useRef<HTMLAudioElement | null>(null);
  const visionIntervalRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Reset inputs on task changes
  useEffect(() => {
    setTextAnswer('');
    setAnswerError('');
    setShowHint(false);
    setIsChatExpanded(false);
    setMediaBlobUrl(null);
    setAudioBase64(null);
    setVideoBase64(null);
    setPhotoBase64(null);
    setIsRecording(false);
    setIsVisionScanning(false);
    setVisionScanPercent(0);
    setGeoError(null);
    setRecordingError(null);

    // Stop active audio playbacks
    if (audioPlayRef.current) {
      try {
        audioPlayRef.current.pause();
      } catch (e) {}
      audioPlayRef.current = null;
      setIsPlaying(false);
    }

    // Stop vision simulation intervals
    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
      visionIntervalRef.current = null;
    }

    // Stop active media recorder streams
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }

    return () => {
      // Cleanup on final component unmount
      if (audioPlayRef.current) {
        try {
          audioPlayRef.current.pause();
        } catch (e) {}
      }
      if (visionIntervalRef.current) {
        clearInterval(visionIntervalRef.current);
      }
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        } catch (e) {}
      }
    };
  }, [focusedTaskId]);

  // Monitor total finished
  const isFinished = progress.completedTaskIds.length === tasks.length && tasks.length > 0;
  useEffect(() => {
    if (isFinished) {
      navigate('/finish');
    }
  }, [isFinished, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
        <p className="text-sm">Загрузка задания...</p>
      </div>
    );
  }

  if (error || !activeTask) {
    return (
      <div className="p-6 text-center space-y-3 bg-red-950/20 border border-red-900/50 rounded-3xl font-sans">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-slate-900 dark:text-white">Ошибка загрузки</h3>
        <p className="text-xs text-red-400">{error || 'Задание не найдено'}</p>
        <button 
          onClick={resetQuest}
          className="bg-red-600 hover:bg-red-500 text-white text-xs px-4 py-2 rounded-xl transition-colors"
        >
          Сбросить квест
        </button>
      </div>
    );
  }

  const isTaskCompleted = progress.completedTaskIds.includes(activeTask.id);

  // Riddle Validation
  const handleRiddleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textAnswer.trim()) {
      setAnswerError('Введите ответ');
      return;
    }

    const cleanUserAnswer = textAnswer.trim().toLowerCase().replace(/ё/g, 'е');
    const acceptableAnswers = activeTask.answers?.map(ans => ans.trim().toLowerCase().replace(/ё/g, 'е')) || [];

    if (acceptableAnswers.includes(cleanUserAnswer)) {
      completeTask(activeTask.id, textAnswer);
    } else {
      setAnswerError('Неверный ответ. Попробуйте еще раз или спросите подсказку у Хранителя!');
    }
  };

  // QR Scan Validation
  const handleQRScanSuccess = (decodedText: string) => {
    const cleanScan = decodedText.trim().toLowerCase();
    const acceptableAnswers = activeTask.answers?.map(ans => ans.trim().toLowerCase()) || [];

    if (acceptableAnswers.includes(cleanScan) || acceptableAnswers.includes('secret_qr_code')) {
      setAnswerError('');
      completeTask(activeTask.id, decodedText);
    } else {
      setAnswerError(`Вы отсканировали: "${decodedText}". Код не соответствует заданию квеста.`);
    }
  };

  // Geolocation handler
  const handleCheckLocation = () => {
    if (!activeTask.coordinates) return;
    setGeoChecking(true);
    setGeoError(null);

    // If simulated coordinates are entered, use those!
    if (simulatedLat && simulatedLon) {
      const lat = parseFloat(simulatedLat);
      const lon = parseFloat(simulatedLon);
      if (isNaN(lat) || isNaN(lon)) {
        setGeoError('Некорректно заполнены координаты симуляции');
        setGeoChecking(false);
        return;
      }

      const distance = getDistanceInMeters(
        lat,
        lon,
        activeTask.coordinates.latitude,
        activeTask.coordinates.longitude
      );

      const radius = activeTask.radius || 100;
      if (distance <= radius) {
        setGeoChecking(false);
        completeTask(activeTask.id, `GPS Check passed (Simulated): ${lat}, ${lon} (Distance: ${Math.round(distance)}m)`);
      } else {
        setGeoError(`Вы все еще далеко! Расстояние: ${Math.round(distance)} метров. Требуемый радиус: ${radius}м.`);
        setGeoChecking(false);
      }
      return;
    }

    // Try real browser GPS geolocation
    if (!navigator.geolocation) {
      setGeoError('Геолокация не поддерживается вашим устройством. Используйте симулятор координат ниже.');
      setGeoChecking(false);
      return;
    }

    try {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const distance = getDistanceInMeters(
            latitude,
            longitude,
            activeTask.coordinates!.latitude,
            activeTask.coordinates!.longitude
          );

          const radius = activeTask.radius || 100;
          if (distance <= radius) {
            setGeoChecking(false);
            completeTask(activeTask.id, `GPS Check passed: ${latitude}, ${longitude} (Distance: ${Math.round(distance)}m)`);
          } else {
            setGeoError(`Вы находитесь на расстоянии ${Math.round(distance)}м от цели. Нам нужно приблизиться к радиусу в ${radius}м. Попробуйте подойти ближе или используйте блок симуляции GPS!`);
            setGeoChecking(false);
          }
        },
        (error) => {
          console.error(error);
          setGeoError('Не удалось получить координаты. Пожалуйста, разрешите доступ к GPS или используйте ручной симулятор GPS внизу.');
          setGeoChecking(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (err: any) {
      console.error('Synchronous Geolocation API error:', err);
      setGeoError('Доступ к геолокации заблокирован политикой безопасности браузера (например, при запуске внутри фрейма). Пожалуйста, воспользуйтесь блоком симуляции GPS ниже.');
      setGeoChecking(false);
    }
  };

  // Auto set simulated coordinates for testers
  const handleAutoPassGeo = () => {
    if (activeTask.coordinates) {
      setSimulatedLat(activeTask.coordinates.latitude.toString());
      setSimulatedLon(activeTask.coordinates.longitude.toString());
    }
  };

  // Helper to compress images to avoid local storage quota limits and heavy rendering
  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  // Photo handlers (with cool mock scanning effect)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const originalBase64 = reader.result as string;
        try {
          const compressedBase64 = await compressImage(originalBase64);
          setPhotoBase64(compressedBase64);
          triggerVisionAI(compressedBase64);
        } catch (err) {
          console.error('Image compression failed, using original', err);
          setPhotoBase64(originalBase64);
          triggerVisionAI(originalBase64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerVisionAI = (imgData: string) => {
    setIsVisionScanning(true);
    setVisionScanPercent(0);

    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
    }

    visionIntervalRef.current = setInterval(() => {
      setVisionScanPercent(prev => {
        if (prev >= 100) {
          if (visionIntervalRef.current) {
            clearInterval(visionIntervalRef.current);
            visionIntervalRef.current = null;
          }
          setTimeout(() => {
            setIsVisionScanning(false);
            // Completed!
            completeTask(activeTask.id, 'Photo verified by Vision AI', { photo: imgData });
          }, 800);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Media (Audio / Video) Record logic
  const handleStartRecording = async (type: 'audio' | 'video') => {
    chunksRef.current = [];
    setRecordingError(null);
    try {
      const constraints = {
        audio: true,
        video: type === 'video' ? { facingMode: 'user' } : false
      };

      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw new Error('Функция записи медиа недоступна в данном браузере или заблокирована настройками безопасности (например, при запуске внутри фрейма). Пожалуйста, воспользуйтесь кнопкой выбора готового файла.');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      const options = { mimeType: type === 'video' ? 'video/webm' : 'audio/webm' };
      
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (err) {
        recorder = new MediaRecorder(stream); // fallback
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setMediaBlobUrl(url);

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          if (type === 'audio') setAudioBase64(base64);
          if (type === 'video') setVideoBase64(base64);
        };
        reader.readAsDataURL(blob);

        // Stop all tracks to release cameras/mics
        stream.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Recording blocked or unsupported:', err);
      setRecordingError('Запись заблокирована или не поддерживается вашим браузером. Пожалуйста, разрешите доступ к микрофону/камере или загрузите медиафайл через кнопку ниже.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Safe file upload fallbacks for Mic / Cam blocked in Iframes
  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      setRecordingError(null);
      const url = URL.createObjectURL(file);
      setMediaBlobUrl(url);

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === 'audio') setAudioBase64(base64);
        if (type === 'video') setVideoBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioPlayback = () => {
    if (!mediaBlobUrl) return;
    if (isPlaying) {
      audioPlayRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioPlayRef.current) {
        audioPlayRef.current = new Audio(mediaBlobUrl);
        audioPlayRef.current.onended = () => setIsPlaying(false);
      }
      audioPlayRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Audio playback failed:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleConfirmMediaTask = (type: 'audio' | 'video') => {
    if (type === 'audio' && audioBase64) {
      completeTask(activeTask.id, 'Audio recorded successfully', { audio: audioBase64 });
    } else if (type === 'video' && videoBase64) {
      completeTask(activeTask.id, 'Video recorded successfully', { video: videoBase64 });
    } else {
      setRecordingError('Пожалуйста, сначала запишите медиафайл или воспользуйтесь кнопкой выбора готового файла!');
    }
  };

  return (
    <div className="space-y-6 pb-24 font-sans text-slate-850 dark:text-slate-200">
      
      {/* HEADER STATISTICS BAR */}
      <div className="bg-white dark:bg-[#18181b] p-5 rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-sm relative overflow-hidden transition-all duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(6,182,212,0.05),transparent)] pointer-events-none"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500 font-bold block">
              Экспедиция Олонхо
            </span>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              Привет, {profile?.firstName || 'Богатырь'}!
            </h2>
          </div>
          <div className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs px-3.5 py-1.5 rounded-2xl border border-cyan-500/20 font-bold flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            <span>{(progress.completedTaskIds.length * 150)} XP</span>
          </div>
        </div>
        
        {/* Progress percent line */}
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-slate-400 dark:text-zinc-500 font-bold">
            <span>Карта Пройдена</span>
            <span>{Math.round((progress.completedTaskIds.length / tasks.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-950 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-900">
            <div 
              className="h-full bg-cyan-500 transition-all duration-500"
              style={{ width: `${(progress.completedTaskIds.length / tasks.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* ROADMAP LEGEND & THEMED COMPASS */}
      <div className="text-center py-2">
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 tracking-widest uppercase font-mono">
          🗺️ Карта Трех Миров
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
          Нажмите на любую локацию на тропе, чтобы открыть детали и начать испытание
        </p>
      </div>

      {/* VERTICAL WINDING PATHWAY (Тропинка с локациями сверху вниз) */}
      <div 
        className="relative py-8 rounded-3xl border border-slate-200/60 dark:border-zinc-800/80 p-4 overflow-hidden min-h-[60vh] transition-all bg-[linear-gradient(to_bottom,#bae6fd_0%,#f0fdf4_50%,#dcfce7_100%)] dark:bg-[linear-gradient(to_bottom,#082f49_0%,#022c22_60%,#020617_100%)] shadow-xl"
        style={{ 
          backgroundImage: customConfig?.backgrounds?.mainBackgroundUrl ? `url(${customConfig.backgrounds.mainBackgroundUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        
        {/* START FLAGPOST milestone */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-full font-mono shadow-sm">
            🏁 Нажмите Старт
          </div>
        </div>

        {/* Central winding connecting line resembling a trail */}
        <div className="absolute inset-x-0 top-12 bottom-12 pointer-events-none">
          <svg 
            className="w-40 h-full mx-auto"
            viewBox="0 0 160 1000"
            preserveAspectRatio="none"
          >
            {/* Underlayer shadow/border of the trail */}
            <path
              d="M 80 0 C 80 50, 32 50, 32 100 C 32 150, 128 150, 128 200 C 128 250, 32 250, 32 300 C 32 350, 128 350, 128 400 C 128 450, 32 450, 32 500 C 32 550, 128 550, 128 600 C 128 650, 32 650, 32 700 C 32 750, 128 750, 128 800 C 128 850, 32 850, 32 900 C 32 930, 128 930, 128 960 C 128 980, 80 980, 80 1000"
              fill="none"
              stroke="#854d0e"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-20"
            />
            {/* The main trail itself */}
            <path
              d="M 80 0 C 80 50, 32 50, 32 100 C 32 150, 128 150, 128 200 C 128 250, 32 250, 32 300 C 32 350, 128 350, 128 400 C 128 450, 32 450, 32 500 C 32 550, 128 550, 128 600 C 128 650, 32 650, 32 700 C 32 750, 128 750, 128 800 C 128 850, 32 850, 32 900 C 32 930, 128 930, 128 960 C 128 980, 80 980, 80 1000"
              fill="none"
              stroke={customConfig?.backgrounds?.trailPrimaryColor || '#c5a880'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Winding dotted line simulating footprint footsteps trail */}
            <path
              d="M 80 0 C 80 50, 32 50, 32 100 C 32 150, 128 150, 128 200 C 128 250, 32 250, 32 300 C 32 350, 128 350, 128 400 C 128 450, 32 450, 32 500 C 32 550, 128 550, 128 600 C 128 650, 32 650, 32 700 C 32 750, 128 750, 128 800 C 128 850, 32 850, 32 900 C 32 930, 128 930, 128 960 C 128 980, 80 980, 80 1000"
              fill="none"
              stroke={customConfig?.backgrounds?.trailDottedColor || 'var(--color-cyan-600)'}
              strokeWidth="3.5"
              strokeDasharray="4,12"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-75"
            />
          </svg>
        </div>

        {/* Location nodes container */}
        <div className="relative space-y-12 z-20 pt-10 pb-10">
          {tasks.map((task, index) => {
            const isCompleted = progress.completedTaskIds.includes(task.id);
            const isActive = task.id === activatedTaskId;
            const isLocked = task.id > progress.currentTaskId && task.id !== activatedTaskId && !progress.completedTaskIds.includes(task.id);

            // Winding offsets: staggered left/right serpentine
            const isLeft = index % 2 === 0;
            const alignClass = isLeft 
              ? '-translate-x-12 sm:-translate-x-16' 
              : 'translate-x-12 sm:translate-x-16';

            return (
              <div key={task.id} className="relative flex items-center justify-center w-full">
                
                {/* Node Container with interactive state */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedTaskForModal(task)}
                  className={`flex flex-col items-center focus:outline-none transition-all cursor-pointer ${alignClass}`}
                >
                  
                  {/* Pseudo-3D Sarge Post */}
                  <div className="relative flex flex-col items-center">
                    {/* Ground Shadow */}
                    <div className="absolute -bottom-1.5 w-14 h-3.5 bg-black/45 dark:bg-black/80 rounded-full blur-[2px] pointer-events-none"></div>

                    {/* Sarge Pillar */}
                    <div className="relative w-12 flex flex-col items-center select-none">
                      
                      {/* Tethered Yakut Horse next to the active Sarge post */}
                      {isActive && (
                        <div className="absolute -left-10 bottom-1 z-30 bg-white/95 dark:bg-zinc-900/95 border border-amber-300/60 p-1.5 rounded-xl shadow-lg flex items-center justify-center animate-bounce">
                          <HorseIcon className="w-5 h-5 text-amber-850 dark:text-amber-400" />
                        </div>
                      )}

                      {/* 1. Ornamental Cap/Finial */}
                      <div className={`w-8 h-4 rounded-t-full bg-gradient-to-r ${
                        isActive 
                          ? 'from-amber-250 via-cyan-100 to-amber-350 border-cyan-400' 
                          : 'from-amber-100 via-amber-50 to-amber-200 border-amber-300/40 dark:from-amber-100 dark:via-amber-200 dark:to-amber-300'
                      } border-t border-x shadow-sm flex items-center justify-center`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-cyan-500 animate-pulse' : 'bg-amber-400 dark:bg-zinc-600'}`}></div>
                      </div>
                      
                      {/* Neck banding */}
                      <div className="w-10 h-[3px] bg-amber-800/40 border-y border-amber-900/10"></div>

                      {/* 2. Main Post Pillar with horizontal carvings */}
                      <div className={`w-10 h-20 bg-gradient-to-r relative flex flex-col justify-between py-1.5 rounded-b-lg ${
                        isActive 
                          ? 'from-amber-200 via-yellow-50 to-amber-300 border-x border-b border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)]' 
                          : isCompleted
                            ? 'from-amber-200 via-cyan-500/10 to-amber-300 border-x-2 border-b-2 border-cyan-600 shadow-sm'
                            : 'from-amber-100 via-amber-50 to-amber-200 border-x border-b border-amber-300/40 dark:from-amber-100/95 dark:via-amber-200/95 dark:to-amber-300/95 shadow-sm text-amber-900'
                      }`}>
                        
                        {/* Carved Band 1 (Cosmological World Ring) */}
                        <div className="w-full h-[2px] bg-black/50 dark:bg-zinc-950/80 opacity-60"></div>

                        {/* Centered shield displaying the current icon/text */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-md transition-all ${
                            isCompleted
                              ? 'bg-cyan-500/10 border-2 border-cyan-600 text-cyan-600 dark:text-cyan-400 shadow-md'
                              : isActive
                                ? 'bg-amber-150 border-cyan-400 text-amber-900 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse'
                                : 'bg-white dark:bg-[#18181b] border-amber-300/30 text-amber-900/60 dark:text-zinc-400'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
                            ) : isActive ? (
                              <HorseIcon className="w-5 h-5 shrink-0" />
                            ) : (
                              <span className="font-mono text-xs font-black">{task.id}</span>
                            )}
                          </div>
                        </div>

                        {/* Carved Band 2 (Cosmological World Ring) */}
                        <div className="w-full h-[2px] bg-black/50 dark:bg-zinc-950/80 opacity-60"></div>
                        
                      </div>

                      {/* 3. Pedestal/Base Mound */}
                      <div className={`w-12 h-2.5 rounded-full bg-gradient-to-t border-t ${
                        isActive 
                          ? 'from-amber-350 to-amber-300 border-cyan-450/40' 
                          : isCompleted
                            ? 'from-amber-300 to-amber-200 border-cyan-500/20'
                            : 'from-amber-200 to-amber-100 dark:from-zinc-900 dark:to-zinc-800 border-slate-350 dark:border-zinc-800'
                      }`}></div>

                    </div>

                    {/* Active tooltip badge */}
                    {isActive && (
                      <span className="absolute -top-7 bg-cyan-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm animate-bounce">
                        Активно
                      </span>
                    )}
                  </div>

                  {/* Title text below Sarge */}
                  <div className="mt-3 text-center max-w-[120px] bg-white/75 dark:bg-[#18181b]/75 backdrop-blur-sm p-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-850 shadow-sm">
                    <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500">Задание {task.id}</p>
                    <h4 className={`text-[10px] font-extrabold truncate ${
                      isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {task.title}
                    </h4>
                  </div>

                </motion.button>
              </div>
            );
          })}
        </div>

        {/* FINISH PORTAL milestone */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
          <div className="bg-cyan-550/10 dark:bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[10px] font-bold px-3 py-1 rounded-full font-mono shadow-sm">
            🏆 Обитель Духов
          </div>
        </div>
      </div>

      {/* TASK DETAIL MODAL */}
      <AnimatePresence>
        {selectedTaskForModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#18181b] rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* MODAL HEADER BLOCK */}
              <div className="bg-slate-50 dark:bg-[#111114] p-4.5 border-b border-slate-200/80 dark:border-zinc-850/80 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-extrabold font-mono px-2.5 py-1 rounded-lg border border-cyan-500/20">
                    Задание {selectedTaskForModal.id}
                  </span>
                  <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold px-2 rounded-lg border border-amber-500/20 font-mono">
                    +150 XP
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedTaskForModal(null)}
                    className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* TASK TITLE & INFO BANNER */}
              <div className="px-5 py-4 bg-slate-50/50 dark:bg-zinc-950/20 border-b border-slate-100 dark:border-zinc-900 shrink-0">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  {selectedTaskForModal.title}
                </h3>
                <p className="text-[10px] font-bold font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 mt-1">
                  Категория: {selectedTaskForModal.type.toUpperCase()}
                </p>
              </div>

              {/* TAB CONTAINER CONTENT */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/30 dark:bg-zinc-950/10 min-h-0">
                
                <div className="space-y-4">
                  
                  {/* Story description text */}
                  <div className="bg-white dark:bg-[#131316] p-4 rounded-2xl border border-slate-250/70 dark:border-zinc-850 shadow-sm leading-relaxed text-xs text-slate-700 dark:text-slate-350 whitespace-pre-line">
                    {selectedTaskForModal.description}
                  </div>

                  {/* Helper placeholder landmark image */}
                  {selectedTaskForModal.media?.image && !photoBase64 && !progress.completedTaskIds.includes(selectedTaskForModal.id) && (
                    <div className="rounded-2xl overflow-hidden max-h-40 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center p-3 relative">
                      <Compass className="absolute w-16 h-16 text-slate-200 dark:text-zinc-800/60 pointer-events-none" />
                      <div className="text-center relative z-10">
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono block">Ориентир испытания:</span>
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">{selectedTaskForModal.media.image}</span>
                      </div>
                    </div>
                  )}

                  {/* STATUS 1: Already Completed Celebration Panel */}
                  {progress.completedTaskIds.includes(selectedTaskForModal.id) ? (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 text-center space-y-2.5">
                      <div className="flex justify-center">
                        <div className="bg-emerald-500/10 p-2.5 rounded-full border border-emerald-500/20 text-emerald-550">
                          <Award className="w-7 h-7" />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">Задание успешно пройдено!</h4>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                          {selectedTaskForModal.successMessage || 'Вы проявили настоящую богатырскую удаль!'}
                        </p>
                      </div>

                      {/* Completed answers recap */}
                      <div className="text-left bg-slate-100/50 dark:bg-zinc-950/75 p-3 rounded-xl text-xs space-y-2 mt-3 border border-slate-200/50 dark:border-zinc-900">
                        <p className="font-mono text-[9px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Ваши результаты на этой точке:</p>
                        
                        {selectedTaskForModal.type === 'riddle' && (
                          <p className="text-slate-700 dark:text-slate-350">
                            Ответ: <strong className="text-emerald-600 dark:text-emerald-400">"{progress.answers[selectedTaskForModal.id]}"</strong>
                          </p>
                        )}

                        {selectedTaskForModal.type === 'qrcode' && (
                          <p className="text-slate-700 dark:text-slate-350">
                            Код: <strong className="text-emerald-600 dark:text-emerald-400">"{progress.answers[selectedTaskForModal.id]}"</strong>
                          </p>
                        )}

                        {selectedTaskForModal.type === 'geolocation' && (
                          <p className="text-slate-700 dark:text-slate-350 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-550" />
                            <span>{progress.answers[selectedTaskForModal.id] || 'Координаты успешно зафиксированы'}</span>
                          </p>
                        )}

                        {selectedTaskForModal.type === 'photo' && progress.photos[selectedTaskForModal.id] && (
                          <div className="space-y-1">
                            <img src={progress.photos[selectedTaskForModal.id]} alt="Quest Capture" className="rounded-lg max-h-28 object-cover border border-slate-200 dark:border-zinc-800" />
                          </div>
                        )}

                        {selectedTaskForModal.type === 'audio' && progress.audios[selectedTaskForModal.id] && (
                          <div className="space-y-1">
                            <audio src={progress.audios[selectedTaskForModal.id]} controls className="h-7 max-w-full rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800" />
                          </div>
                        )}

                        {selectedTaskForModal.type === 'video' && progress.videos[selectedTaskForModal.id] && (
                          <div className="space-y-1">
                            <video src={progress.videos[selectedTaskForModal.id]} controls className="rounded-lg max-h-28 object-cover border border-slate-250 dark:border-zinc-800" />
                          </div>
                        )}
                      </div>
                    </div>
                  ) : selectedTaskForModal.id > progress.currentTaskId ? (
                    
                    /* STATUS 2: Locked Future Location on Trail */
                    <div className="bg-slate-150/40 dark:bg-zinc-900/45 p-5 rounded-2xl border border-slate-200 dark:border-zinc-800/80 text-center space-y-2">
                      <Lock className="w-8 h-8 text-slate-400 dark:text-zinc-650 mx-auto" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Испытание заблокировано</h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                        Сначала одолейте предыдущие испытания на тропинке, чтобы открыть доступ к этой локации! Вы можете почитать легенду или проконсультироваться у Духа Иччи во вкладке ИИ.
                      </p>
                    </div>

                  ) : (

                    /* STATUS 3: Available next linear task */
                    <div className="space-y-4">
                      
                      {/* Interactive Start Activation Button */}
                      {!isActivated ? (
                        <div className="text-center space-y-3 py-2">
                          {showActivationWarning ? (
                            <div className="bg-amber-500/10 dark:bg-amber-950/45 p-4 rounded-2xl border border-amber-500/20 text-left space-y-3 animate-fade-in">
                              <div className="flex gap-2 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                <h4 className="text-xs font-black">Смена активного задания</h4>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed">
                                У вас уже активировано другое задание: <strong className="text-slate-800 dark:text-white">«{tasks.find(t => t.id === activatedTaskId)?.title}»</strong>. 
                                Активация этого задания сбросит несохраненные действия по предыдущему заданию. Продолжить?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setActivatedTaskId(selectedTaskForModal.id);
                                    setIsActivated(true);
                                    setShowActivationWarning(false);
                                    // Reset active media/inputs
                                    setTextAnswer('');
                                    setAudioBase64(null);
                                    setVideoBase64(null);
                                    setPhotoBase64(null);
                                  }}
                                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-extrabold py-2 px-3 rounded-xl text-[11px] transition-all cursor-pointer text-center shadow-sm"
                                >
                                  Да, продолжить
                                </button>
                                <button
                                  onClick={() => setShowActivationWarning(false)}
                                  className="flex-1 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold py-2 px-3 rounded-xl text-[11px] transition-all cursor-pointer text-center"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                                Вы находитесь на этой точке! Активируйте задание, чтобы ввести ответ или записать подтверждение.
                              </p>
                              <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={handleActivateTask}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <Sparkles className="w-4 h-4 animate-pulse" />
                                Активировать задание
                              </motion.button>
                            </>
                          )}
                        </div>
                      ) : (
                        
                        /* Activated Interaction Fields workspace */
                        <div className="bg-white dark:bg-[#131316] p-4.5 rounded-2xl border border-slate-200 dark:border-zinc-850 shadow-inner space-y-4">
                          
                          {/* RIDDLE CHALLENGE */}
                          {selectedTaskForModal.type === 'riddle' && (
                            <form onSubmit={handleRiddleSubmit} className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-450 dark:text-zinc-500 uppercase tracking-wider mb-1">
                                  Ваш ответ на загадку:
                                </label>
                                <input
                                  type="text"
                                  value={textAnswer}
                                  onChange={(e) => {
                                    setTextAnswer(e.target.value);
                                    if (answerError) setAnswerError('');
                                  }}
                                  placeholder="Введите слово или фразу..."
                                  className={`w-full px-4 py-2.5 rounded-xl border ${
                                    answerError 
                                      ? 'border-red-500 focus:ring-red-500/30' 
                                      : 'border-slate-200 dark:border-zinc-800 focus:ring-cyan-500/30 focus:border-cyan-500'
                                  } bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 text-xs transition-all`}
                                />
                              </div>

                              {answerError && (
                                <p className="text-[11px] text-red-500 flex items-start gap-1.5 mt-1 leading-snug">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{answerError}</span>
                                </p>
                              )}

                              <motion.button
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-md text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                              >
                                Проверить ответ
                                <ChevronRight className="w-4 h-4" />
                              </motion.button>
                            </form>
                          )}

                          {/* PHOTO CHALLENGE */}
                          {selectedTaskForModal.type === 'photo' && (
                            <div className="space-y-4">
                              {!photoBase64 ? (
                                <div className="grid grid-cols-2 gap-3">
                                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 dark:border-zinc-800 hover:border-cyan-500 dark:hover:border-cyan-500/70 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950/40 text-center transition-all cursor-pointer group active:scale-[0.98]">
                                    <Camera className="w-6 h-6 text-slate-400 dark:text-zinc-500 mb-1.5 group-hover:text-cyan-500" />
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Камера</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={handlePhotoUpload}
                                      className="hidden"
                                    />
                                  </label>

                                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-250 dark:border-zinc-800 hover:border-cyan-500 dark:hover:border-cyan-500/70 rounded-2xl p-4 bg-slate-50 dark:bg-zinc-950/40 text-center transition-all cursor-pointer group active:scale-[0.98]">
                                    <Upload className="w-6 h-6 text-slate-400 dark:text-zinc-500 mb-1.5 group-hover:text-cyan-500" />
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Галерея</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handlePhotoUpload}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              ) : (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-850 bg-slate-100 dark:bg-zinc-950">
                                  <img src={photoBase64} alt="Preview Capture" className="w-full max-h-48 object-cover" />
                                  {isVisionScanning && (
                                    <div className="absolute inset-0 bg-cyan-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                                      <div className="bg-white dark:bg-[#111114] p-3.5 rounded-xl text-center border border-cyan-500/40 text-slate-900 dark:text-white max-w-[170px]">
                                        <Compass className="w-6 h-6 mx-auto text-cyan-500 dark:text-cyan-400 animate-spin-slow mb-1.5" />
                                        <div className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-mono">Сканирование</div>
                                        <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1 rounded-full overflow-hidden mt-1.5">
                                          <div className="bg-cyan-500 h-full transition-all duration-200" style={{ width: `${visionScanPercent}%` }}></div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* GEOLOCATION CHALLENGE */}
                          {selectedTaskForModal.type === 'geolocation' && (
                            <div className="space-y-3">
                              <div className="p-3 bg-slate-100/55 dark:bg-zinc-950/80 rounded-xl border border-slate-200/50 dark:border-zinc-850 text-xs text-slate-650 dark:text-zinc-450 font-mono space-y-1">
                                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1 mb-1">
                                  <MapPin className="w-3.5 h-3.5 text-cyan-500" /> Цель:
                                </p>
                                <p>Широта: {selectedTaskForModal.coordinates?.latitude}</p>
                                <p>Долгота: {selectedTaskForModal.coordinates?.longitude}</p>
                                <p>Дистанция: до {selectedTaskForModal.radius || 100}м</p>
                              </div>

                              {geoError && (
                                <div className="p-2.5 bg-red-550/10 border border-red-500/20 text-red-500 text-[10px] rounded-lg">
                                  {geoError}
                                </div>
                              )}

                              <button
                                onClick={handleCheckLocation}
                                disabled={geoChecking}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                              >
                                {geoChecking ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" /> Определение спутников...
                                  </>
                                ) : (
                                  <>
                                    <MapPin className="w-4 h-4" /> Проверить координаты
                                  </>
                                )}
                              </button>

                              {/* GPS Simulator panel inside modal */}
                              <div className="p-3 bg-slate-100/40 dark:bg-zinc-900/60 rounded-xl border border-slate-200/55 dark:border-zinc-850/80 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-bold font-mono text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Симулятор GPS координат</span>
                                  <button onClick={handleAutoPassGeo} className="text-[9px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline">
                                    Заполнить цель
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="text"
                                    value={simulatedLat}
                                    onChange={(e) => setSimulatedLat(e.target.value)}
                                    placeholder="Широта"
                                    className="px-2 py-1 text-[10px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded outline-none text-slate-900 dark:text-slate-100 focus:border-cyan-500/30"
                                  />
                                  <input
                                    type="text"
                                    value={simulatedLon}
                                    onChange={(e) => setSimulatedLon(e.target.value)}
                                    placeholder="Долгота"
                                    className="px-2 py-1 text-[10px] bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded outline-none text-slate-900 dark:text-slate-100 focus:border-cyan-500/30"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* QR CODE CHALLENGE */}
                          {selectedTaskForModal.type === 'qrcode' && (
                            <div className="space-y-3">
                              <QRScanner 
                                onScanSuccess={handleQRScanSuccess} 
                                expectedValue={selectedTaskForModal.answers?.[0]} 
                              />
                              {answerError && (
                                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded-lg">
                                  {answerError}
                                </div>
                              )}
                            </div>
                          )}

                          {/* AUDIO CHALLENGE */}
                          {selectedTaskForModal.type === 'audio' && (
                            <div className="space-y-3 text-center">
                              {recordingError && (
                                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded-lg text-left">
                                  {recordingError}
                                </div>
                              )}
                              
                              <div className="flex justify-center">
                                {!isRecording ? (
                                  <button
                                    onClick={() => handleStartRecording('audio')}
                                    className="bg-red-600 hover:bg-red-500 text-white p-3.5 rounded-full shadow-lg transition-all cursor-pointer"
                                  >
                                    <Mic className="w-5 h-5 animate-pulse" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleStopRecording}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-3.5 rounded-full shadow-lg transition-all cursor-pointer"
                                  >
                                    <Square className="w-5 h-5" />
                                  </button>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                                {isRecording ? 'Произнесите "Уруй-Айхал!" в микрофон...' : 'Нажмите для записи (минимум 3 секунды)'}
                              </p>

                              {mediaBlobUrl && (
                                <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl space-y-2 text-left">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Аудио готово к отправке:</span>
                                    <button
                                      onClick={handleAudioPlayback}
                                      className="bg-cyan-600 hover:bg-cyan-500 text-white p-1 rounded-full"
                                    >
                                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleConfirmMediaTask('audio')}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Отправить аудиоотчет
                                  </button>
                                </div>
                              )}

                              {/* Fallback file loader for iframe */}
                              <div className="pt-2 text-left">
                                <label className="block text-[8px] font-mono font-bold text-slate-400 uppercase mb-0.5">Либо загрузите файл (для iframe):</label>
                                <input
                                  type="file"
                                  accept="audio/*"
                                  onChange={(e) => handleMediaFileUpload(e, 'audio')}
                                  className="text-[10px] text-zinc-500 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                          {/* VIDEO CHALLENGE */}
                          {selectedTaskForModal.type === 'video' && (
                            <div className="space-y-3 text-center">
                              {recordingError && (
                                <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] rounded-lg text-left">
                                  {recordingError}
                                </div>
                              )}

                              <div className="flex justify-center">
                                {!isRecording ? (
                                  <button
                                    onClick={() => handleStartRecording('video')}
                                    className="bg-red-600 hover:bg-red-500 text-white p-3.5 rounded-full shadow-lg transition-all cursor-pointer"
                                  >
                                    <Video className="w-5 h-5 animate-pulse" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={handleStopRecording}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white p-3.5 rounded-full shadow-lg transition-all cursor-pointer"
                                  >
                                    <Square className="w-5 h-5" />
                                  </button>
                                )}
                              </div>

                              <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                                {isRecording ? 'Запись видео (360 градусов)...' : 'Нажмите для панорамной съемки местности'}
                              </p>

                              {mediaBlobUrl && (
                                <div className="p-3 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl space-y-2 text-left">
                                  <video src={mediaBlobUrl} controls className="w-full max-h-24 rounded bg-black" />
                                  <button
                                    onClick={() => handleConfirmMediaTask('video')}
                                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2 rounded-lg text-[11px] font-bold cursor-pointer"
                                  >
                                    Отправить видеоотчет
                                  </button>
                                </div>
                              )}

                              {/* Fallback file loader for iframe */}
                              <div className="pt-2 text-left">
                                <label className="block text-[8px] font-mono font-bold text-slate-400 uppercase mb-0.5">Либо загрузите видео (для iframe):</label>
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleMediaFileUpload(e, 'video')}
                                  className="text-[10px] text-zinc-500 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}

                        </div>
                      )}

                      {/* Quick Clue Accordion Helper inside modal */}
                      <div className="bg-white dark:bg-[#131316] p-4 rounded-2xl border border-slate-200 dark:border-zinc-850/80 space-y-2.5 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-cyan-500 animate-spin-slow shrink-0" /> Помощь Духа Иччи
                          </span>
                          <button
                            onClick={() => setShowHint(!showHint)}
                            className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                          >
                            {showHint ? 'Скрыть наводку' : 'Показать наводку'}
                          </button>
                        </div>
                        {showHint && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="space-y-3 pt-1.5"
                          >
                            {/* Static Clue Text */}
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/5 p-2.5 rounded-xl border border-amber-500/15 leading-relaxed">
                              🌿 Наводка Духа: <span className="font-normal italic">"{selectedTaskForModal.hint}"</span>
                            </div>

                            {/* Chat messages with the Spirit */}
                            <div className="max-h-52 overflow-y-auto space-y-2.5 p-2 bg-slate-50/50 dark:bg-zinc-950/25 rounded-xl border border-slate-100 dark:border-zinc-900">
                              {chatMessages.length === 0 && (
                                <p className="text-[9px] text-slate-400 dark:text-zinc-500 italic text-center py-2">
                                  Дух Иччи готов направить твой помысел, богатырь...
                                </p>
                              )}
                              
                              {chatMessages.map((msg) => {
                                const isAI = msg.sender === 'ai';
                                return (
                                  <div
                                    key={msg.id}
                                    className={`flex gap-1.5 max-w-[92%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                                  >
                                    <div className={`w-5 h-5 rounded-md shrink-0 flex items-center justify-center text-[9px] font-bold border ${
                                      isAI 
                                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' 
                                        : 'bg-slate-150 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-zinc-700'
                                    }`}>
                                      {isAI ? '🌿' : '👤'}
                                    </div>
                                    <div className="space-y-0.5">
                                      <div className={`p-2 rounded-xl text-[10px] leading-relaxed border ${
                                        isAI 
                                          ? 'bg-white dark:bg-[#18181b] border-slate-150 dark:border-zinc-850 text-slate-800 dark:text-slate-300 rounded-tl-none shadow-sm' 
                                          : 'bg-cyan-600 border-cyan-600 text-white font-bold rounded-tr-none shadow-sm'
                                      }`}>
                                        <p className="whitespace-pre-line">{msg.text}</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}

                              {isChatLoading && (
                                <div className="flex gap-1.5 max-w-[92%] mr-auto">
                                  <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/20 text-[9px]">
                                    🌿
                                  </div>
                                  <div className="bg-white dark:bg-[#18181b] border border-slate-150 dark:border-zinc-850 p-2 rounded-xl rounded-tl-none flex items-center gap-1 shadow-sm">
                                    <span className="w-1 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce"></span>
                                    <span className="w-1 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-1 h-1 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                  </div>
                                </div>
                              )}
                              
                              <div ref={modalChatEndRef} />
                            </div>

                            {/* Mini Input Box inside accordion */}
                            <form onSubmit={handleModalSendChat} className="flex gap-1.5">
                              <input
                                type="text"
                                value={modalChatInput}
                                onChange={(e) => setModalChatInput(e.target.value)}
                                disabled={isChatLoading}
                                placeholder="Задать свой вопрос Духу..."
                                className="flex-1 px-3 py-1.5 text-[10px] bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                              />
                              <button
                                type="submit"
                                disabled={!modalChatInput.trim() || isChatLoading}
                                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white p-1.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-sm"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

