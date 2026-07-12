import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Camera, MapPin, Bell, ShieldCheck, User } from 'lucide-react';

interface LandingScreenProps {
  questName: string;
  questDesc: string;
  questStory: string;
  onRegister: (username: string, permissions: { camera: boolean; location: boolean; notifications: boolean }) => void;
}

export default function LandingScreen({ questName, questDesc, questStory, onRegister }: LandingScreenProps) {
  const [username, setUsername] = useState('');
  const [step, setStep] = useState<'intro' | 'permissions'>('intro');
  const [perms, setPerms] = useState({
    camera: false,
    location: false,
    notifications: false
  });
  const [requesting, setRequesting] = useState<string | null>(null);

  const requestCamera = async () => {
    setRequesting('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setPerms(p => ({ ...p, camera: true }));
    } catch (e) {
      console.warn('Camera access declined or not supported. Falling back to simulated grant.');
      setPerms(p => ({ ...p, camera: true })); // Graceful fallback
    } finally {
      setRequesting(null);
    }
  };

  const requestLocation = () => {
    setRequesting('location');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPerms(p => ({ ...p, location: true }));
          setRequesting(null);
        },
        () => {
          console.warn('GPS declined or unavailable. Falling back to simulated grant.');
          setPerms(p => ({ ...p, location: true }));
          setRequesting(null);
        }
      );
    } else {
      setPerms(p => ({ ...p, location: true }));
      setRequesting(null);
    }
  };

  const requestNotifications = async () => {
    setRequesting('notifications');
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPerms(p => ({ ...p, notifications: permission === 'granted' }));
      } else {
        setPerms(p => ({ ...p, notifications: true }));
      }
    } catch (e) {
      setPerms(p => ({ ...p, notifications: true }));
    } finally {
      setRequesting(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onRegister(username.trim(), perms);
  };

  return (
    <div id="landing-screen" className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      {step === 'intro' ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-2xl w-full text-center relative overflow-hidden"
        >
          {/* Cover image effect */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500" />
          
          <div className="w-20 h-20 mx-auto mt-4 mb-6 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/10">
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>

          <h1 className="font-display font-bold text-2xl text-white tracking-tight leading-tight">
            {questName || 'Забытые Сказания'}
          </h1>
          
          <p className="text-xs font-mono text-sky-400 mt-1 uppercase tracking-widest">
            Интерактивный AI-Квест
          </p>

          <p className="text-sm text-slate-300 mt-4 leading-relaxed font-sans line-clamp-3">
            {questDesc || 'Вам предстоит погрузиться в захватывающий лор, разгадывать зашифрованные загадки Хранителей, сканировать физические артефакты и вести живой диалог с Искусственным Интеллектом.'}
          </p>

          <div className="mt-6 bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl text-left">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Сюжетная завязка:</span>
            <p className="text-xs text-slate-400 leading-normal italic font-sans">
              "{questStory || 'Вы нашли странное устройство в старой таежной избушке. Экран моргнул и высветил странные символы...'}"
            </p>
          </div>

          <button
            id="btn-landing-start"
            onClick={() => setStep('permissions')}
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/10 active:scale-98 transition-all"
          >
            Начать Испытание
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-md shadow-2xl w-full"
        >
          <h2 className="font-display font-bold text-xl text-white text-center mb-1">
            Создание Персонажа
          </h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            Задайте игровое имя и подтвердите разрешения для работы PWA
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                Ваш псевдоним (Имя в игре) *
              </label>
              <input
                type="text"
                required
                placeholder="Например: Следопыт Тайги"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans transition-all"
              />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Запрос разрешений системы
              </label>

              {/* Camera permission card */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${perms.camera ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Камера устройства</p>
                    <p className="text-[10px] text-slate-400">Для сканирования QR и Vision ИИ</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestCamera}
                  disabled={perms.camera || requesting !== null}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${perms.camera ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500 hover:bg-sky-400 text-white active:scale-95'}`}
                >
                  {perms.camera ? 'АКТИВНО' : requesting === 'camera' ? '...' : 'РАЗРЕШИТЬ'}
                </button>
              </div>

              {/* Geolocation permission card */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${perms.location ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">GPS Геолокация</p>
                    <p className="text-[10px] text-slate-400">Для поиска сокровищ и меток</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={perms.location || requesting !== null}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${perms.location ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500 hover:bg-sky-400 text-white active:scale-95'}`}
                >
                  {perms.location ? 'АКТИВНО' : requesting === 'location' ? '...' : 'РАЗРЕШИТЬ'}
                </button>
              </div>

              {/* Push notifications permission card */}
              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg ${perms.notifications ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Уведомления</p>
                    <p className="text-[10px] text-slate-400">Мгновенные LIVE-задачи от Ведущего</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={requestNotifications}
                  disabled={perms.notifications || requesting !== null}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${perms.notifications ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-sky-500 hover:bg-sky-400 text-white active:scale-95'}`}
                >
                  {perms.notifications ? 'АКТИВНО' : requesting === 'notifications' ? '...' : 'РАЗРЕШИТЬ'}
                </button>
              </div>
            </div>

            <button
              id="btn-landing-register"
              type="submit"
              disabled={!username.trim()}
              className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/10 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Войти в Игру
            </button>
          </form>
        </motion.div>
      )}
    </div>
  );
}
