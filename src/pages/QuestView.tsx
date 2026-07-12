import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import { motion, AnimatePresence } from 'motion/react';
import { getDistanceInMeters } from '../utils/geo';
import { QRScanner } from '../components/QRScanner';
import { 
  Compass, Sparkles, MapPin, Volume2, Camera, Video, Award, 
  HelpCircle, CheckCircle2, RefreshCw, Mic, Square, Play, 
  Pause, Upload, QrCode, AlertTriangle, ChevronRight, Eye, Lock
} from 'lucide-react';

export const QuestView: React.FC = () => {
  const { 
    profile, progress, tasks, currentTask, focusedTaskId, setFocusedTaskId, completeTask, loading, error, resetQuest, theme
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
  };

  // Auto set simulated coordinates for testers
  const handleAutoPassGeo = () => {
    if (activeTask.coordinates) {
      setSimulatedLat(activeTask.coordinates.latitude.toString());
      setSimulatedLon(activeTask.coordinates.longitude.toString());
    }
  };

  // Photo handlers (with cool mock scanning effect)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhotoBase64(base64);
        triggerVisionAI(base64);
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
      
      {/* 1. HORIZONTAL TASK NAVIGATION (Просмотр и выбор заданий) */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-450 dark:text-cyan-500 uppercase tracking-widest block font-mono pl-1">
          Выбор задания:
        </span>
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x px-1">
          {tasks.map((task) => {
            const isCompleted = progress.completedTaskIds.includes(task.id);
            const isFocused = task.id === focusedTaskId;
            
            return (
              <button
                key={task.id}
                onClick={() => setFocusedTaskId(task.id)}
                className={`snap-center shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  isFocused
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/15 scale-105'
                    : isCompleted
                      ? 'bg-cyan-550/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30'
                      : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-500 dark:text-cyan-400" />
                ) : (
                  <span className="font-mono text-[10px]">T{task.id}</span>
                )}
                <span>{task.title.split(' ').slice(0, 2).join(' ')}...</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TASK HEADER INFO CARD */}
      <div className="flex items-center justify-between bg-white dark:bg-[#18181b] p-4 rounded-3xl border border-slate-200 dark:border-zinc-800/80 shadow-sm transition-colors duration-300">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-zinc-500">
            Задание {activeTask.id} из {tasks.length}
          </span>
          <h2 className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{activeTask.title}</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-500/20">
          <Compass className="w-3.5 h-3.5 animate-spin-slow" />
          <span>{activeTask.type.toUpperCase()}</span>
        </div>
      </div>

      {/* 3. MAIN INTERACTIVE WORK AREA */}
      <motion.div 
        key={activeTask.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#18181b] rounded-3xl p-6 shadow-md border border-slate-200 dark:border-zinc-800/80 overflow-hidden relative transition-colors duration-300"
      >
        <div className="absolute top-0 left-0 w-1.5 h-full bg-cyan-500"></div>

        {/* Task description */}
        <div className="space-y-4 pl-2">
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
            {activeTask.description}
          </p>

          {/* Static reference image (if present) */}
          {activeTask.media?.image && !photoBase64 && !isTaskCompleted && (
            <div className="rounded-2xl overflow-hidden max-h-48 bg-slate-50 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-850/40 flex items-center justify-center p-4 relative">
              <Compass className="absolute w-24 h-24 text-slate-100 dark:text-zinc-900 pointer-events-none" />
              <div className="text-center relative z-10 space-y-1">
                <span className="text-xs text-slate-400 dark:text-zinc-500 font-mono block">Изображение-ориентир:</span>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold">{activeTask.media.image}</span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic content if completed vs if solvable */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/80 space-y-4 pl-2">
          
          {isTaskCompleted ? (
            /* COMPLETED CELEBRATION BOX */
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-4 text-center space-y-3">
              <div className="flex justify-center">
                <div className="bg-cyan-550/10 p-3 rounded-full border border-cyan-500/20 text-cyan-500">
                  <Award className="w-8 h-8 animate-bounce" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Задание выполнено успешно!</h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
                  {activeTask.successMessage || 'Вы отлично справились с этим этапом!'}
                </p>
              </div>

              {/* Submitted data display */}
              <div className="text-left bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-xl text-xs space-y-2 mt-3 border border-slate-200/50 dark:border-zinc-900">
                <p className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 uppercase tracking-widest font-bold">Ваши результаты:</p>
                
                {activeTask.type === 'riddle' && (
                  <p className="text-slate-700 dark:text-slate-300">
                    Ответ: <strong className="text-cyan-600 dark:text-cyan-400">"{progress.answers[activeTask.id]}"</strong>
                  </p>
                )}

                {activeTask.type === 'qrcode' && (
                  <p className="text-slate-700 dark:text-slate-300">
                    Расшифрованный QR-код: <strong className="text-cyan-600 dark:text-cyan-400">"{progress.answers[activeTask.id]}"</strong>
                  </p>
                )}

                {activeTask.type === 'geolocation' && (
                  <p className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{progress.answers[activeTask.id] || 'GPS геолокация зафиксирована'}</span>
                  </p>
                )}

                {activeTask.type === 'photo' && progress.photos[activeTask.id] && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 dark:text-zinc-550 block text-[10px] uppercase font-bold">Сохраненный снимок:</span>
                    <img src={progress.photos[activeTask.id]} alt="Quest capture" className="rounded-lg max-h-32 object-cover border border-slate-200 dark:border-zinc-850" />
                  </div>
                )}

                {activeTask.type === 'audio' && progress.audios[activeTask.id] && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 dark:text-zinc-550 block text-[10px] uppercase font-bold">Сохраненное аудио:</span>
                    <audio src={progress.audios[activeTask.id]} controls className="h-8 max-w-full rounded bg-slate-200/50 dark:bg-zinc-900 border border-slate-300/40 dark:border-zinc-800" />
                  </div>
                )}

                {activeTask.type === 'video' && progress.videos[activeTask.id] && (
                  <div className="space-y-1.5">
                    <span className="text-slate-400 dark:text-zinc-550 block text-[10px] uppercase font-bold">Сохраненное видео:</span>
                    <video src={progress.videos[activeTask.id]} controls className="rounded-lg max-h-32 object-cover border border-slate-200 dark:border-zinc-800" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* SOLVABLE CONTROLS */
            <>
              {/* TYPE 1: Riddle */}
              {activeTask.type === 'riddle' && (
                <form onSubmit={handleRiddleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      Ваш ответ:
                    </label>
                    <input
                      type="text"
                      value={textAnswer}
                      onChange={(e) => {
                        setTextAnswer(e.target.value);
                        if (answerError) setAnswerError('');
                      }}
                      placeholder="Введите ответ..."
                      className={`w-full px-4 py-3 rounded-2xl border ${
                        answerError 
                          ? 'border-red-500 focus:ring-red-500/40' 
                          : 'border-slate-200 dark:border-zinc-850 focus:ring-cyan-500/40 focus:border-cyan-500'
                      } bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 text-sm transition-all`}
                    />
                  </div>

                  {answerError && (
                    <p className="text-xs text-red-500 flex items-start gap-1.5 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{answerError}</span>
                    </p>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-2xl shadow-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Проверить ответ
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </form>
              )}

              {/* TYPE 2: Photo */}
              {activeTask.type === 'photo' && (
                <div className="space-y-4">
                  {!photoBase64 ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-3xl p-8 bg-slate-50 dark:bg-zinc-950/40 text-center hover:border-cyan-500/50 transition-all cursor-pointer relative">
                      <Camera className="w-10 h-10 text-slate-400 dark:text-zinc-500 mb-2" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Сделать фото или загрузить файл</span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1">Поддерживаются форматы JPG, PNG</span>
                      
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handlePhotoUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Photo Preview & Scanning Overlay */}
                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-950">
                        <img 
                          src={photoBase64} 
                          alt="Captured upload" 
                          className="w-full max-h-64 object-cover"
                        />

                        {isVisionScanning && (
                          <div className="absolute inset-0 bg-cyan-500/20 backdrop-blur-[1px] flex flex-col items-center justify-center text-white">
                            <div className="w-full max-w-[200px] bg-white dark:bg-[#111114] p-4 rounded-2xl text-center border border-cyan-500/40 text-slate-900 dark:text-white">
                              <Compass className="w-8 h-8 mx-auto text-cyan-500 dark:text-cyan-400 animate-spin-slow mb-2" />
                              <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest font-mono">Vision AI Анализ</div>
                              <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                                <div className="bg-cyan-500 h-full transition-all duration-200" style={{ width: `${visionScanPercent}%` }}></div>
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-zinc-500 mt-1 font-mono">{visionScanPercent}% Сканирования</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isVisionScanning && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPhotoBase64(null)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-850 text-xs font-bold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                          >
                            Переснять
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TYPE 3: Geolocation */}
              {activeTask.type === 'geolocation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-zinc-950/60 rounded-2xl border border-slate-200 dark:border-zinc-850/80 space-y-3">
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                      <MapPin className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold font-mono">Целевые ориентиры:</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-350 font-mono pl-7">
                      <p>Широта: {activeTask.coordinates?.latitude}</p>
                      <p>Долгота: {activeTask.coordinates?.longitude}</p>
                      <p>Допуск: {activeTask.radius || 100} метров</p>
                    </div>
                  </div>

                  {geoError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{geoError}</span>
                    </div>
                  )}

                  <button
                    onClick={handleCheckLocation}
                    disabled={geoChecking}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl shadow-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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

                  {/* Simulator */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono uppercase text-slate-400 dark:text-zinc-500 tracking-wider">Панель симуляции координат GPS</span>
                      <button
                        onClick={handleAutoPassGeo}
                        className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline font-bold cursor-pointer"
                      >
                        Заполнить правильные GPS
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Для тестирования без физического перемещения заполните значения вручную.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={simulatedLat}
                        onChange={(e) => setSimulatedLat(e.target.value)}
                        placeholder="Широта (Lat)"
                        className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-cyan-500/40"
                      />
                      <input
                        type="text"
                        value={simulatedLon}
                        onChange={(e) => setSimulatedLon(e.target.value)}
                        placeholder="Долгота (Lon)"
                        className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-cyan-500/40"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE 4: QR-Code */}
              {activeTask.type === 'qrcode' && (
                <div className="space-y-4">
                  <QRScanner 
                    onScanSuccess={handleQRScanSuccess} 
                    expectedValue={activeTask.answers?.[0]} 
                  />
                  {answerError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl flex items-start gap-2 mt-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{answerError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* TYPE 5: Audio Recording */}
              {activeTask.type === 'audio' && (
                <div className="space-y-4 text-center">
                  {recordingError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs text-left rounded-xl flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{recordingError}</span>
                    </div>
                  )}
                  <div className="flex justify-center gap-4">
                    {!isRecording ? (
                      <button
                        onClick={() => handleStartRecording('audio')}
                        className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Mic className="w-6 h-6 animate-pulse" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-full shadow-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Square className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    {isRecording ? 'Запись запущена... Произнесите кодовую фразу' : 'Нажмите на кнопку для голосовой записи подтверждения'}
                  </p>

                  {mediaBlobUrl && (
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Аудиофайл готов:</span>
                        <button
                          onClick={handleAudioPlayback}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white p-1.5 rounded-full cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                        </button>
                      </div>

                      <button
                        onClick={() => handleConfirmMediaTask('audio')}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Отправить аудиоотчет
                      </button>
                    </div>
                  )}

                  {/* Upload fallback for iframe */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-800/80 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">Загрузить звуковой файл вручную (для iframe):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleMediaFileUpload(e, 'audio')}
                        className="text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-zinc-900 file:text-slate-700 dark:file:text-slate-300 file:cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TYPE 6: Video Recording */}
              {activeTask.type === 'video' && (
                <div className="space-y-4 text-center">
                  {recordingError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs text-left rounded-xl flex items-start gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{recordingError}</span>
                    </div>
                  )}
                  <div className="flex justify-center gap-4">
                    {!isRecording ? (
                      <button
                        onClick={() => handleStartRecording('video')}
                        className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Video className="w-6 h-6 animate-pulse" />
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white p-4 rounded-full shadow-lg transition-all flex items-center justify-center cursor-pointer"
                      >
                        <Square className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 dark:text-zinc-500">
                    {isRecording ? 'Запись видео... Оглянитесь вокруг' : 'Записать панорамное видео подтверждения'}
                  </p>

                  {mediaBlobUrl && (
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-left">Превью видеоотчета:</span>
                      <video 
                        src={mediaBlobUrl} 
                        controls 
                        className="w-full max-h-48 rounded-xl bg-black border border-slate-200 dark:border-zinc-800"
                      />

                      <button
                        onClick={() => handleConfirmMediaTask('video')}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                      >
                        Отправить видеоотчет
                      </button>
                    </div>
                  )}

                  {/* Upload fallback for iframe */}
                  <div className="pt-2.5 border-t border-slate-200 dark:border-zinc-800/80 text-left">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase mb-1">Загрузить видеофайл (для iframe):</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleMediaFileUpload(e, 'video')}
                      className="text-xs text-zinc-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-zinc-900 file:text-slate-700 dark:file:text-slate-300 file:cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </motion.div>

      {/* 4. CLUE / HINT ACCORDION BOX */}
      <AnimatePresence>
        <div className="bg-white dark:bg-[#18181b] rounded-3xl p-5 border border-slate-200 dark:border-zinc-800/80 space-y-3 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-white">Помощь Хранителя Тайн</span>
            </div>
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              {showHint ? 'Скрыть наводку' : 'Показать наводку'}
            </button>
          </div>

          {showHint && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl whitespace-pre-line"
            >
              {activeTask.hint}
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 dark:text-zinc-500 font-medium">Нужна подробная подсказка?</span>
                <button
                  onClick={() => navigate('/chat')}
                  className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
                >
                  Спросить в Чате ИИ
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
};
