import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  Trash2, 
  Play, 
  StopCircle, 
  Users, 
  User, 
  QrCode, 
  Clock, 
  Camera, 
  MapPin, 
  HelpCircle,
  Sparkles,
  Layers,
  Volume2,
  Video,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { LiveEvent, StepType } from '../../packages/types/index';

interface EventsTabProps {
  liveEvents: LiveEvent[];
  setLiveEvents: (events: LiveEvent[]) => void;
  playersList: any[];
}

export default function EventsTab({ liveEvents, setLiveEvents, playersList }: EventsTabProps) {
  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } as Record<string, string>;
    return fetch(url, { ...options, headers });
  };

  // Form states
  const [title, setTitle] = useState('Экстренный Радиосигнал');
  const [description, setDescription] = useState('В окрестностях реки замечен древний Сэргэ! Отыщите его и введите код.');
  const [type, setType] = useState<StepType>('TEXT');
  const [targetType, setTargetType] = useState<'all' | 'group' | 'single'>('all');
  const [singleTargetId, setSingleTargetId] = useState('');
  
  // Type specific configurations
  const [textAnswers, setTextAnswers] = useState('лиственница, дерево');
  const [textIgnoreCaps, setTextIgnoreCaps] = useState(true);
  const [textStripWhitespace, setTextStripWhitespace] = useState(true);
  
  const [qrString, setQrString] = useState('SECRET_GPS_GATE');
  
  const [photoReference, setPhotoReference] = useState('A weathered, ancient wooden pole carvings standing outdoors');
  const [photoMatchPercentage, setPhotoMatchPercentage] = useState(70);

  const [locLat, setLocLat] = useState(62.0315);
  const [locLng, setLocLng] = useState(129.733);
  const [locRadius, setLocRadius] = useState(30);

  const [timerDuration, setTimerDuration] = useState(600);

  // Status logs
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // BROADCAST TRIGGERS
  const handleDispatch = async () => {
    if (!title.trim() || !description.trim()) return;

    const newEvent: LiveEvent = {
      id: `live-${Math.random().toString(36).substring(2, 7)}`,
      title,
      description,
      type,
      verificationData: {
        answers: type === 'TEXT' ? textAnswers.split(',').map(a => a.trim().toLowerCase()) : undefined,
        qrCode: type === 'QR' ? qrString : undefined,
        coords: type === 'LOCATION' ? { lat: locLat, lng: locLng, radius: locRadius } : undefined,
        duration: type === 'TIMER' ? timerDuration : undefined
      },
      reward: {
        xp: 150,
        item: type === 'QR' ? 'Таинственный Кристалл' : undefined
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Post to express backend modular live dispatch route which triggers SSE broadcasts
      const res = await adminFetch('/api/admin/live-events', {
        method: 'POST',
        body: JSON.stringify({ 
          event: newEvent,
          target: targetType,
          userId: targetType === 'single' ? singleTargetId : undefined
        })
      });
      const saved = await res.json();
      
      if (!res.ok) {
        alert(`Ошибка публикации события: ${saved.error || 'Неизвестная ошибка'}`);
        return;
      }
      
      setLiveEvents([...liveEvents, saved]);
      setDispatchSuccess(true);
      setTimeout(() => setDispatchSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to dispatch live event:', err);
      alert('Произошла ошибка связи с сервером при публикации события');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await adminFetch(`/api/admin/live-events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLiveEvents(liveEvents.filter(e => e.id !== id));
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Ошибка удаления события: ${errData.error || 'Неизвестная ошибка'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Произошла ошибка связи с сервером при удалении события');
    }
  };

  return (
    <div className="space-y-8" id="live-events-tab">
      
      {/* TITLE */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
          <Radio className="text-rose-500 animate-pulse w-7 h-7" />
          Центр Живого Вещания (Live Broadcast Studio)
        </h2>
        <p className="text-slate-400 text-sm">Транслируйте мгновенные вызовы, GPS-метки и таймеры активности на мобильные экраны игроков по SSE-каналу.</p>
      </div>

      {/* DETAILED BROADCAST COMPOSER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COMPOSER FORM CARD */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-6">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Создать новое LIVE-событие
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 text-xs">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Заголовок трансляции</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Пример: Внезапное затмение"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500" 
              />
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Тип живого события</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as StepType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="TEXT">Вопрос / Интерактивный чат (TEXT)</option>
                <option value="QR">Поиск скрытого QR-кода (QR)</option>
                <option value="PHOTO">Верификация Vision AI по фото (PHOTO)</option>
                <option value="LOCATION">Срочный сбор в GPS точке (LOCATION)</option>
                <option value="TIMER">Временной таймер на выживание (TIMER)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="text-[10px] text-slate-500 font-bold uppercase">Текст вещания (Инструкция / Загадка)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Введите описание, которое появится на экранах..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed" 
            />
          </div>

          {/* TARGET PLAYER GROUP CONFIG */}
          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-xs text-indigo-400">Настройки аудитории вещания</h4>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input 
                  type="radio" 
                  name="targetType" 
                  checked={targetType === 'all'} 
                  onChange={() => setTargetType('all')} 
                  className="accent-indigo-500" 
                />
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-slate-400" />
                  Всем игрокам
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input 
                  type="radio" 
                  name="targetType" 
                  checked={targetType === 'single'} 
                  onChange={() => setTargetType('single')} 
                  className="accent-indigo-500" 
                />
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-slate-400" />
                  Одному игроку
                </span>
              </label>
            </div>

            {targetType === 'single' && (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">Выберите игрока</label>
                <select 
                  value={singleTargetId}
                  onChange={(e) => setSingleTargetId(e.target.value)}
                  className="w-full max-w-xs bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">-- Выбрать из списка онлайн --</option>
                  {playersList.map(p => (
                    <option key={p.userId} value={p.userId}>{p.username} (Lvl {p.level})</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* DYNAMIC COMPONENT BASED ON SELECTED EVENT TYPE */}
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
            <h4 className="font-bold text-xs uppercase text-rose-400 tracking-wider">Параметры проверки: {type}</h4>

            {type === 'TEXT' && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Ожидаемый ответ</label>
                  <input 
                    type="text" 
                    value={textAnswers} 
                    onChange={(e) => setTextAnswers(e.target.value)} 
                    placeholder="береза, дуб" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3" 
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400">
                    <input type="checkbox" checked={textIgnoreCaps} onChange={(e) => setTextIgnoreCaps(e.target.checked)} className="accent-rose-500" />
                    Игнорировать регистр
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400">
                    <input type="checkbox" checked={textStripWhitespace} onChange={(e) => setTextStripWhitespace(e.target.checked)} className="accent-rose-500" />
                    Игнорировать пробелы
                  </label>
                </div>
              </div>
            )}

            {type === 'QR' && (
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Строка QR шифра</label>
                  <input 
                    type="text" 
                    value={qrString} 
                    onChange={(e) => setQrString(e.target.value)} 
                    placeholder="LIVE_GPS_EAST_GATE" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3" 
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-mono">
                  Вы можете напечатать этот QR-код или показать его на большом экране штаба квеста.
                </p>
              </div>
            )}

            {type === 'PHOTO' && (
              <div className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Описание эталона для Vision ИИ на сервере</label>
                  <textarea 
                    value={photoReference} 
                    onChange={(e) => setPhotoReference(e.target.value)}
                    placeholder="A close-up photograph of a metallic key, lock, or security tool"
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500">
                    <span>Порог совпадения Vision AI</span>
                    <span className="text-pink-400">{photoMatchPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="40" 
                    max="95" 
                    value={photoMatchPercentage} 
                    onChange={(e) => setPhotoMatchPercentage(parseInt(e.target.value))} 
                    className="w-full accent-pink-500" 
                  />
                </div>
              </div>
            )}

            {type === 'LOCATION' && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">Широта (GPS Lat)</label>
                    <input type="number" step="any" value={locLat} onChange={(e) => setLocLat(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold">Долгота (GPS Lng)</label>
                    <input type="number" step="any" value={locLng} onChange={(e) => setLocLng(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Радиус зоны прибытия (Метры)</label>
                  <input type="number" value={locRadius} onChange={(e) => setLocRadius(parseInt(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2" />
                </div>
              </div>
            )}

            {type === 'TIMER' && (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Длительность таймера обратного отсчета (Секунды)</label>
                  <input 
                    type="number" 
                    value={timerDuration} 
                    onChange={(e) => setTimerDuration(parseInt(e.target.value))} 
                    placeholder="600" 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2" 
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  По истечении времени прохождение шага заблокируется.
                </p>
              </div>
            )}

          </div>

          {/* Action trigger button and status indicators */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800/60">
            {dispatchSuccess ? (
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 animate-bounce" />
                Радиосигнал отправлен по SSE-каналу!
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-mono">
                Трансляция вещается мгновенно
              </span>
            )}
            <button 
              onClick={handleDispatch}
              className="py-3 px-6 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
            >
              <Send className="w-4 h-4 animate-pulse" />
              <span>Запустить вещание</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE RUNNING DISPATCHED EVENTS */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-800 space-y-4">
            <h4 className="font-extrabold text-base">Активные живые трансляции</h4>
            <p className="text-xs text-slate-400">
              Эти события сейчас отображаются поверх стандартных экранов игроков:
            </p>

            <div className="space-y-3">
              {liveEvents.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-slate-800 text-slate-500 space-y-2">
                  <Radio className="w-8 h-8 mx-auto text-slate-600 stroke-1" />
                  <div className="text-xs">Активных эфиров нет.</div>
                </div>
              ) : (
                liveEvents.map((ev) => (
                  <div key={ev.id} className="p-4 rounded-xl bg-slate-950 border border-slate-850 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1.5 h-full bg-rose-500" />
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className="font-bold text-sm text-slate-100">{ev.title}</h5>
                        <span className="text-[10px] text-rose-400 font-semibold uppercase">{ev.type}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteEvent(ev.id)}
                        className="p-1 hover:text-red-400 text-slate-500 transition-colors"
                        title="Остановить эфир"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{ev.description}</p>
                    <div className="pt-2 border-t border-slate-900 flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Награда: +{ev.reward.xp} XP</span>
                      <span>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
