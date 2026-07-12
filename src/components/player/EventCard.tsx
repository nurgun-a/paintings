import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, XCircle, Camera, QrCode, MapPin, 
  Timer, Send, Compass, Eye, ShieldAlert, Loader2 
} from 'lucide-react';
import { QuestStep } from '../../packages/types';

interface EventCardProps {
  step: QuestStep;
  onSubmitText: (text: string) => Promise<boolean>;
  onSubmitQR: (code: string) => Promise<boolean>;
  onSubmitPhoto: (base64: string) => Promise<boolean>;
  onSubmitLocation: (lat: number, lng: number) => Promise<boolean>;
  onSubmitTimer?: () => Promise<boolean>;
  onTimerComplete: () => void;
  offlineMode: boolean;
}

export default function EventCard({
  step,
  onSubmitText,
  onSubmitQR,
  onSubmitPhoto,
  onSubmitLocation,
  onSubmitTimer,
  onTimerComplete,
  offlineMode
}: EventCardProps) {
  // Input fields state
  const [textVal, setTextVal] = useState('');
  const [qrVal, setQrVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // QR Scanning Simulation & Video Stream State
  const [cameraActive, setCameraActive] = useState(false);
  const [scanningProgress, setScanningProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // GPS state
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Timer countdown
  const [timeLeft, setTimeLeft] = useState<number>(step.verificationData.duration || 60);

  // Reset card state when step changes
  useEffect(() => {
    setTextVal('');
    setQrVal('');
    setStatus('idle');
    setErrorMsg('');
    setCoords(null);
    setDistance(null);
    if (step.verificationData.duration) {
      setTimeLeft(step.verificationData.duration);
    }
  }, [step]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (step.type !== 'TIMER' || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step.type, timeLeft]);

  // --- QR CAMERA LOGIC ---
  const startQRScanner = async () => {
    setCameraActive(true);
    setScanningProgress(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Unable to stream back camera:', err);
    }
  };

  const stopQRScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setCameraActive(false);
    setScanningProgress(0);
  };

  useEffect(() => {
    if (!cameraActive) return;
    const interval = setInterval(() => {
      setScanningProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          // Simulate QR decoded value matching
          const simulatedCode = step.verificationData.qrCode || 'ICHCHI_SERGE_77';
          setQrVal(simulatedCode);
          stopQRScanner();
          handleVerifyQR(simulatedCode);
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [cameraActive]);

  // --- PHOTO COMPRESSION ---
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress photo to save bandwith
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        handleUploadPhoto(compressedBase64);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async (base64: string) => {
    try {
      const ok = await onSubmitPhoto(base64);
      if (ok) {
        setStatus('success');
      } else {
        setStatus('failed');
        setErrorMsg('Фотография не совпала с эталоном. Попробуйте еще раз.');
      }
    } catch (e) {
      setErrorMsg('Ошибка отправки снимка');
    } finally {
      setLoading(false);
    }
  };

  // --- GPS GEOLOCATION CALC ---
  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleGPSRetrieve = () => {
    setGpsLoading(true);
    setErrorMsg('');
    if (!('geolocation' in navigator)) {
      setErrorMsg('Геолокация не поддерживается вашим устройством.');
      setGpsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        // Calculate distance if target coordinates exist
        const target = step.verificationData.coords || { lat: 62.03, lng: 129.74, radius: 20 };
        const d = haversineDistance(latitude, longitude, target.lat, target.lng);
        setDistance(Math.round(d));

        try {
          const ok = await onSubmitLocation(latitude, longitude);
          if (ok) {
            setStatus('success');
          } else {
            setStatus('failed');
            setErrorMsg(`Вы находитесь слишком далеко от цели (Расстояние: ${Math.round(d)}м). Радиус: ${target.radius}м.`);
          }
        } catch (err) {
          setErrorMsg('Сбой при верификации геопозиции.');
        } finally {
          setGpsLoading(false);
        }
      },
      (err) => {
        setErrorMsg('Не удалось получить координаты GPS. Разрешите доступ к геопозиции.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSimulateGPS = async () => {
    setGpsLoading(true);
    setErrorMsg('');
    const target = step.verificationData.coords || { lat: 62.03, lng: 129.74, radius: 20 };
    // Add tiny random offset within the radius
    const simulatedLat = target.lat + (Math.random() - 0.5) * 0.00002;
    const simulatedLng = target.lng + (Math.random() - 0.5) * 0.00002;
    
    setCoords({ lat: simulatedLat, lng: simulatedLng });
    const d = haversineDistance(simulatedLat, simulatedLng, target.lat, target.lng);
    setDistance(Math.round(d));

    try {
      const ok = await onSubmitLocation(simulatedLat, simulatedLng);
      if (ok) {
        setStatus('success');
      } else {
        setStatus('failed');
        setErrorMsg(`Симулированное расстояние: ${Math.round(d)}м. Радиус: ${target.radius}м.`);
      }
    } catch (err) {
      setErrorMsg('Сбой при верификации симулированной геопозиции.');
    } finally {
      setGpsLoading(false);
    }
  };

  // --- SUBMISSIONS ---
  const handleVerifyText = async () => {
    if (!textVal.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const ok = await onSubmitText(textVal);
      if (ok) {
        setStatus('success');
      } else {
        setStatus('failed');
        setErrorMsg('Неверный текстовый ответ. Перечитайте подсказку!');
      }
    } catch (e) {
      setErrorMsg('Ошибка сети при верификации.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyQR = async (code: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const ok = await onSubmitQR(code);
      if (ok) {
        setStatus('success');
      } else {
        setStatus('failed');
        setErrorMsg('QR-код не соответствует целям задания.');
      }
    } catch (e) {
      setErrorMsg('Ошибка верификации QR.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id={`event-card-${step.id}`} className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl shadow-xl max-w-sm w-full mx-auto backdrop-blur-sm">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <span className="inline-block px-2.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/20 text-[9px] font-mono rounded-full font-bold uppercase tracking-wider mb-1.5">
            Испытание: {step.type}
          </span>
          <h4 className="font-display font-semibold text-sm text-white">{step.title}</h4>
        </div>
        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
          {step.type === 'TEXT' && <Send className="w-4 h-4 text-sky-400" />}
          {step.type === 'QR' && <QrCode className="w-4 h-4 text-emerald-400" />}
          {step.type === 'PHOTO' && <Camera className="w-4 h-4 text-amber-400" />}
          {step.type === 'LOCATION' && <MapPin className="w-4 h-4 text-indigo-400" />}
          {step.type === 'TIMER' && <Timer className="w-4 h-4 text-rose-400" />}
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-normal mb-4 font-sans">
        {step.description}
      </p>

      {/* Rewards snippet */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 bg-slate-950/40 border border-slate-800/60 px-3 py-1.5 rounded-xl mb-4">
        <span>Награда: <span className="text-emerald-400">+{step.reward.xp} XP</span></span>
        {step.reward.item && <span className="truncate max-w-[120px]">🎒 {step.reward.item}</span>}
      </div>

      {/* DYNAMIC VIEW FOR INPUT VERIFICATION */}
      <div className="mt-2.5">
        {status === 'success' ? (
          <div className="bg-emerald-500/10 border border-emerald-500/25 p-3 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-semibold text-emerald-400">Успешно пройдено!</p>
              <p className="text-[10px] text-slate-400">Игровой прогресс синхронизирован с Хранителем.</p>
            </div>
          </div>
        ) : (
          <>
            {/* 1. TEXT CONTROLS */}
            {step.type === 'TEXT' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Введите ответ..."
                  value={textVal}
                  onChange={(e) => setTextVal(e.target.value)}
                  disabled={loading}
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 text-white"
                />
                <button
                  onClick={handleVerifyText}
                  disabled={loading || !textVal.trim()}
                  className="bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white p-2.5 rounded-xl transition-all flex-shrink-0"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* 2. QR SCANNER CONTROLS */}
            {step.type === 'QR' && (
              <div className="flex flex-col gap-2.5">
                {cameraActive ? (
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {/* Glowing green scanning laser bar */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-md shadow-emerald-500/80 animate-bounce" />
                    <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm p-1.5 rounded text-center">
                      <p className="text-[9px] font-mono text-emerald-400 tracking-wider">ИДЕТ СКАНИРОВАНИЕ ИИ ({scanningProgress}%)</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={startQRScanner}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Запустить QR-сканер ИИ
                  </button>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ввести код вручную..."
                    value={qrVal}
                    onChange={(e) => setQrVal(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                  <button
                    onClick={() => handleVerifyQR(qrVal)}
                    disabled={loading || !qrVal.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 px-3.5 rounded-xl text-white font-semibold text-xs"
                  >
                    Ввести
                  </button>
                </div>
              </div>
            )}

            {/* 3. PHOTO ATTACHMENT CONTROLS */}
            {step.type === 'PHOTO' && (
              <div className="flex flex-col gap-3">
                <label className="w-full border-2 border-dashed border-slate-800 hover:border-amber-500/60 transition-all rounded-2xl py-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/40">
                  <Camera className="w-8 h-8 text-amber-500 animate-pulse" />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-slate-300">Открыть камеру телефона</p>
                    <p className="text-[10px] text-slate-500">Сделайте снимок объекта квеста</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoCapture}
                    disabled={loading}
                    className="hidden"
                  />
                </label>

                {loading && (
                  <div className="flex items-center justify-center gap-2 py-1.5 text-xs font-mono text-amber-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Vision AI анализирует сходство...</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. GPS LOCATION CONTROLS */}
            {step.type === 'LOCATION' && (
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleGPSRetrieve}
                  disabled={gpsLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Запрос координат у спутников...
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} />
                      Подтвердить Геопозицию (GPS)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSimulateGPS}
                  disabled={gpsLoading}
                  className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/30 text-indigo-400 font-mono text-[10px] rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-indigo-400" />
                  Симулировать прибытие по GPS (для тестов)
                </button>

                {distance !== null && (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-xl text-center">
                    <p className="text-[11px] text-slate-300 font-mono">
                      Расстояние до цели: <span className="text-indigo-400 font-bold">{distance} метров</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 5. TIMER CONTROLS */}
            {step.type === 'TIMER' && (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full border-4 border-rose-500/20 border-t-rose-500 mx-auto flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }} />
                <div>
                  <p className="text-2xl font-mono font-bold text-rose-500">{timeLeft} сек</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-mono">Осталось времени до автоматического завершения</p>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (onSubmitTimer) {
                      setLoading(true);
                      try {
                        const ok = await onSubmitTimer();
                        if (ok) {
                          setStatus('success');
                        } else {
                          setStatus('failed');
                          setErrorMsg('Не удалось завершить обряд.');
                        }
                      } catch (err) {
                        setErrorMsg('Ошибка отправки запроса завершения обряда.');
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  disabled={loading}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Завершить обряд и зафиксировать успех
                </button>
              </div>
            )}

            {/* Error notifications */}
            {errorMsg && (
              <div className="mt-3 bg-rose-500/10 border border-rose-500/25 p-2.5 rounded-xl flex items-start gap-2">
                <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-rose-400 font-sans text-left leading-normal">{errorMsg}</span>
              </div>
            )}
          </>
        )}
      </div>

      {offlineMode && (
        <div className="mt-3.5 pt-3.5 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-amber-500 bg-amber-500/5 px-2 py-1 rounded-lg">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> ОФЛАЙН РЕЖИМ
          </span>
          <span>Действие сохранится локально</span>
        </div>
      )}
    </div>
  );
}
