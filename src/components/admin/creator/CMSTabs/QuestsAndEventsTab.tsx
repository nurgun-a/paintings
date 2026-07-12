import React, { useState } from 'react';
import { 
  Plus, Trash2, Copy, MoveUp, MoveDown, Search, Type, QrCode, Camera, MapPin, Clock, HelpCircle, Code, CheckCircle, Info 
} from 'lucide-react';
import { CMSProject } from '../types';
import { QuestStep, StepType } from '../../../../packages/types/index';

interface QuestsAndEventsTabProps {
  project: Partial<CMSProject>;
  onChange: (updated: Partial<CMSProject>) => void;
}

export default function QuestsAndEventsTab({ project, onChange }: QuestsAndEventsTabProps) {
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Multi-answer state helpers
  const [tempAnswer, setTempAnswer] = useState('');

  const steps = project.steps || [];

  const handleCreateStep = () => {
    const newStep: QuestStep = {
      id: `step-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Новый этап квеста',
      description: 'Исследуйте окружение и введите ключевую разгадку...',
      type: 'TEXT',
      verificationData: {
        answers: ['правильно', 'да'],
        coords: { lat: 55.7558, lng: 37.6173, radius: 50 }
      },
      reward: {
        xp: 100,
        item: ''
      }
    };
    const updated = [...steps, newStep];
    onChange({ steps: updated });
    setActiveStepIndex(updated.length - 1);
  };

  const handleCopyStep = (index: number) => {
    const stepToCopy = steps[index];
    const clone: QuestStep = {
      ...JSON.parse(JSON.stringify(stepToCopy)),
      id: `step-${Math.random().toString(36).substring(2, 7)}`,
      title: `${stepToCopy.title} (Копия)`
    };
    const updated = [...steps];
    updated.splice(index + 1, 0, clone);
    onChange({ steps: updated });
    setActiveStepIndex(index + 1);
  };

  const handleDeleteStep = (index: number) => {
    if (steps.length <= 1) {
      alert('В квесте должен быть по крайней мере один шаг.');
      return;
    }
    if (!confirm('Вы действительно хотите навсегда удалить этот этап?')) return;
    const updated = steps.filter((_, idx) => idx !== index);
    onChange({ steps: updated });
    setActiveStepIndex(Math.max(0, index - 1));
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const updated = [...steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    onChange({ steps: updated });
    setActiveStepIndex(targetIdx);
  };

  const handleStepFieldChange = (stepIdx: number, field: keyof QuestStep, value: any) => {
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      [field]: value
    };
    onChange({ steps: updated });
  };

  const handleVerificationChange = (stepIdx: number, field: string, value: any) => {
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      verificationData: {
        ...updated[stepIdx].verificationData,
        [field]: value
      }
    };
    onChange({ steps: updated });
  };

  const handleRewardChange = (stepIdx: number, field: string, value: any) => {
    const updated = [...steps];
    updated[stepIdx] = {
      ...updated[stepIdx],
      reward: {
        ...updated[stepIdx].reward,
        [field]: value
      }
    };
    onChange({ steps: updated });
  };

  // Search/Filter matching logic
  const filteredSteps = steps.filter((step, index) => {
    const matchesSearch = step.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          step.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || step.type === filterType;
    return matchesSearch && matchesType;
  });

  const activeStep = activeStepIndex !== null && steps[activeStepIndex] ? steps[activeStepIndex] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="cms-quests-and-steps">
      
      {/* 1. LEFT PANEL: STEP THUMBNAILS (col-span-4) */}
      <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 p-4 rounded-3xl flex flex-col h-[650px]">
        
        {/* Filter controls */}
        <div className="space-y-2 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Поиск по этапам..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Все типы проверок</option>
            <option value="TEXT">📝 Текстовый ввод</option>
            <option value="QR">🔲 Сканирование QR</option>
            <option value="PHOTO">📸 Фото (Vision AI)</option>
            <option value="LOCATION">📍 Гео-координаты</option>
            <option value="TIMER">⏳ Таймер / Ограничение времени</option>
          </select>
        </div>

        {/* Steps Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredSteps.map((step) => {
            const indexInMaster = steps.findIndex(s => s.id === step.id);
            const isActive = activeStepIndex === indexInMaster;
            return (
              <div
                key={step.id}
                onClick={() => setActiveStepIndex(indexInMaster)}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative group ${
                  isActive 
                    ? 'bg-slate-850 border-indigo-500 shadow-md shadow-indigo-500/5' 
                    : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                    {indexInMaster + 1}
                  </span>
                  
                  <div className="space-y-1 overflow-hidden flex-1">
                    <h4 className={`font-display font-bold text-xs truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>{step.title || 'Новый этап'}</h4>
                    <p className="text-[9px] text-slate-500 font-mono tracking-wider flex items-center gap-1">
                      {step.type === 'TEXT' && <Type className="w-3 h-3 text-emerald-400" />}
                      {step.type === 'QR' && <QrCode className="w-3 h-3 text-sky-400" />}
                      {step.type === 'PHOTO' && <Camera className="w-3 h-3 text-amber-400" />}
                      {step.type === 'LOCATION' && <MapPin className="w-3 h-3 text-rose-400" />}
                      {step.type === 'TIMER' && <Clock className="w-3 h-3 text-purple-400" />}
                      {step.type}
                    </p>
                  </div>
                </div>

                {/* Step controls on hover */}
                <div className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                  <button title="Вверх" onClick={(e) => { e.stopPropagation(); handleMoveStep(indexInMaster, 'up'); }} className="p-1 bg-slate-900 rounded-md hover:bg-slate-800 text-slate-400">
                    <MoveUp className="w-3 h-3" />
                  </button>
                  <button title="Вниз" onClick={(e) => { e.stopPropagation(); handleMoveStep(indexInMaster, 'down'); }} className="p-1 bg-slate-900 rounded-md hover:bg-slate-800 text-slate-400">
                    <MoveDown className="w-3 h-3" />
                  </button>
                  <button title="Копировать" onClick={(e) => { e.stopPropagation(); handleCopyStep(indexInMaster); }} className="p-1 bg-slate-900 rounded-md hover:bg-slate-800 text-slate-400">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button title="Удалить" onClick={(e) => { e.stopPropagation(); handleDeleteStep(indexInMaster); }} className="p-1 bg-slate-900 border border-red-950 rounded-md hover:bg-red-950 text-red-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Step Button */}
        <button
          onClick={handleCreateStep}
          className="w-full mt-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          Добавить Шаг квеста
        </button>
      </div>

      {/* 2. RIGHT PANEL: EDITING CONTEXT WINDOW (col-span-8) */}
      <div className="lg:col-span-8">
        {activeStep && activeStepIndex !== null ? (
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-6 h-[650px] overflow-y-auto animate-fadeIn">
            
            {/* STAGE HEADER METADATA */}
            <div className="border-b border-slate-800 pb-4 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest">Этап {activeStepIndex + 1}</span>
                  <input
                    type="text"
                    value={activeStep.title}
                    onChange={(e) => handleStepFieldChange(activeStepIndex, 'title', e.target.value)}
                    className="bg-transparent font-display font-extrabold text-xl text-white focus:outline-none border-b border-transparent focus:border-indigo-500 w-full"
                    placeholder="Название этапа..."
                  />
                </div>
                
                {/* Visual Step Type Picker */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
                  {(['TEXT', 'QR', 'PHOTO', 'LOCATION', 'TIMER'] as StepType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => handleStepFieldChange(activeStepIndex, 'type', t)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                        activeStep.type === t 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-slate-500 uppercase">Описание задания для игрока</label>
                <textarea
                  value={activeStep.description}
                  onChange={(e) => handleStepFieldChange(activeStepIndex, 'description', e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Объясните игроку, куда идти или какую загадку решить..."
                />
              </div>
            </div>

            {/* EVENT SPECIFIC CONFIGURATION FIELDS */}
            <div className="space-y-5">
              <h4 className="font-display font-bold text-xs text-slate-300 uppercase tracking-wider">Параметры проверки решения</h4>

              {/* TEXT STEP ENGINE */}
              {activeStep.type === 'TEXT' && (
                <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-850/60 animate-fadeIn">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-slate-400 uppercase flex justify-between">
                      <span>Список правильных ответов</span>
                      <span className="text-[9px] text-slate-500">Регистр не важен</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Добавить вариант..."
                        value={tempAnswer}
                        onChange={(e) => setTempAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tempAnswer) {
                            const answers = activeStep.verificationData.answers || [];
                            handleVerificationChange(activeStepIndex, 'answers', [...answers, tempAnswer.toLowerCase().trim()]);
                            setTempAnswer('');
                          }
                        }}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none flex-1"
                      />
                      <button
                        onClick={() => {
                          if (!tempAnswer) return;
                          const answers = activeStep.verificationData.answers || [];
                          handleVerificationChange(activeStepIndex, 'answers', [...answers, tempAnswer.toLowerCase().trim()]);
                          setTempAnswer('');
                        }}
                        className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                      >
                        Ок
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(activeStep.verificationData.answers || []).map((ans, aIdx) => (
                        <span key={aIdx} className="bg-slate-900 border border-slate-850 text-emerald-400 font-mono text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                          {ans}
                          <button
                            onClick={() => {
                              const answers = (activeStep.verificationData.answers || []).filter((_, idx) => idx !== aIdx);
                              handleVerificationChange(activeStepIndex, 'answers', answers);
                            }}
                            className="text-slate-500 hover:text-red-400 font-bold ml-1"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {(activeStep.verificationData.answers || []).length === 0 && (
                        <p className="text-[10px] text-slate-500 italic">Нет заданных вариантов. Игрок застрянет!</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Подсказка ИИ (Hint)</label>
                      <input
                        type="text"
                        placeholder="Например: Цвет цветка синий..."
                        value={(activeStep.verificationData as any).hint || ''}
                        onChange={(e) => handleVerificationChange(activeStepIndex, 'hint', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                        Проверка Регулярным Выражением (RegEx) <Code className="w-3.5 h-3.5 text-slate-500" title="Дополнительное условие" />
                      </label>
                      <input
                        type="text"
                        placeholder="^\d+$ (только цифры)"
                        value={(activeStep.verificationData as any).regexPattern || ''}
                        onChange={(e) => handleVerificationChange(activeStepIndex, 'regexPattern', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Комментарий ИИ при победе</label>
                      <input
                        type="text"
                        placeholder="Ура, тайник открылся!"
                        value={(activeStep.verificationData as any).successMessage || ''}
                        onChange={(e) => handleVerificationChange(activeStepIndex, 'successMessage', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Комментарий ИИ при ошибке</label>
                      <input
                        type="text"
                        placeholder="Мимо! Стены задрожали..."
                        value={(activeStep.verificationData as any).errorMessage || ''}
                        onChange={(e) => handleVerificationChange(activeStepIndex, 'errorMessage', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* QR STEP ENGINE */}
              {activeStep.type === 'QR' && (
                <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-850/60 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Значение QR кода для сканирования</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                      placeholder="Например: ancient-chest-secret-key"
                      value={activeStep.verificationData.qrCode || ''}
                      onChange={(e) => handleVerificationChange(activeStepIndex, 'qrCode', e.target.value)}
                    />
                  </div>

                  {activeStep.verificationData.qrCode && (
                    <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl flex flex-col items-center gap-3">
                      <div className="w-32 h-32 bg-white p-2.5 rounded-lg border flex items-center justify-center relative">
                        {/* Simulation Vector QR Code block */}
                        <QrCode className="w-full h-full text-black" />
                        <span className="absolute bottom-1 right-1 text-[8px] font-mono text-slate-400">ID: {activeStep.id}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            alert(`Печать QR-кода: ${activeStep.verificationData.qrCode}`);
                          }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          🖨️ Распечатать QR
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeStep.verificationData.qrCode || '');
                            alert('Значение скопировано!');
                          }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300"
                        >
                          💾 Экспортировать QR
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PHOTO / VISION AI STEP ENGINE */}
              {activeStep.type === 'PHOTO' && (
                <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-850/60 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                      Эталонный объект для ИИ (Описание / Название)
                      <Info className="w-3.5 h-3.5 text-slate-500" title="Например: 'деревянный мостик через ручей' или 'табличка музея'" />
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                      placeholder="Например: Памятник из бронзы, скульптура льва"
                      value={activeStep.verificationData.referenceImage || ''}
                      onChange={(e) => handleVerificationChange(activeStepIndex, 'referenceImage', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Процент уверенности нейросети (Match %)</label>
                      <span className="text-xs font-mono font-bold text-amber-400">{(activeStep as any).confidenceThreshold || 80}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      className="w-full accent-amber-500"
                      value={(activeStep as any).confidenceThreshold || 80}
                      onChange={(e) => {
                        const updated = [...steps];
                        (updated[activeStepIndex] as any).confidenceThreshold = parseInt(e.target.value);
                        onChange({ steps: updated });
                      }}
                    />
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Примеры резервных эталонов для сопоставления</span>
                    <p className="text-[11px] text-slate-400">DeepSeek-V3 проанализирует загруженный снимок на совпадение с описанием. Для повышения точности мы используем доп. маркеры.</p>
                  </div>
                </div>
              )}

              {/* LOCATION STEP ENGINE */}
              {activeStep.type === 'LOCATION' && (
                <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-850/60 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Широта (Latitude)</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        placeholder="55.7558"
                        value={activeStep.verificationData.coords?.lat || ''}
                        onChange={(e) => {
                          const coords = activeStep.verificationData.coords || { lat: 0, lng: 0, radius: 50 };
                          handleVerificationChange(activeStepIndex, 'coords', { ...coords, lat: parseFloat(e.target.value) || 0 });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Долгота (Longitude)</label>
                      <input
                        type="number"
                        step="0.0001"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        placeholder="37.6173"
                        value={activeStep.verificationData.coords?.lng || ''}
                        onChange={(e) => {
                          const coords = activeStep.verificationData.coords || { lat: 0, lng: 0, radius: 50 };
                          handleVerificationChange(activeStepIndex, 'coords', { ...coords, lng: parseFloat(e.target.value) || 0 });
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Радиус поиска (м)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                        placeholder="30"
                        value={activeStep.verificationData.coords?.radius || ''}
                        onChange={(e) => {
                          const coords = activeStep.verificationData.coords || { lat: 0, lng: 0, radius: 50 };
                          handleVerificationChange(activeStepIndex, 'coords', { ...coords, radius: parseInt(e.target.value) || 50 });
                        }}
                      />
                    </div>
                  </div>

                  {/* VISUAL GPS PICKER PLACEHOLDER */}
                  <div className="h-44 bg-slate-900 border border-slate-850 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-4 text-center">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />
                    
                    <div className="z-10 bg-rose-500/10 border border-rose-500 p-2.5 rounded-full text-rose-500 animate-pulse mb-2">
                      <MapPin className="w-5 h-5" />
                    </div>
                    
                    <div className="z-10 space-y-1">
                      <span className="text-xs font-semibold text-slate-300">Интерактивный радар координат</span>
                      <p className="text-[10px] text-slate-500 font-mono">Широта: {activeStep.verificationData.coords?.lat || '0'} | Долгота: {activeStep.verificationData.coords?.lng || '0'}</p>
                    </div>

                    <button
                      onClick={() => {
                        // Ask browser location
                        navigator.geolocation.getCurrentPosition((pos) => {
                          const coords = activeStep.verificationData.coords || { lat: 0, lng: 0, radius: 50 };
                          handleVerificationChange(activeStepIndex, 'coords', {
                            lat: Number(pos.coords.latitude.toFixed(6)),
                            lng: Number(pos.coords.longitude.toFixed(6)),
                            radius: coords.radius
                          });
                          alert('Текущее местоположение успешно скопировано в координаты!');
                        }, (err) => {
                          alert('Не удалось получить доступ к GPS.');
                        });
                      }}
                      className="absolute bottom-3 right-3 px-3 py-1 bg-slate-950 border border-slate-800 text-[10px] text-indigo-400 font-mono font-bold rounded-lg hover:border-slate-700"
                    >
                      📡 Вставить мою гео-позицию
                    </button>
                  </div>
                </div>
              )}

              {/* TIMER EVENT ENGINE */}
              {activeStep.type === 'TIMER' && (
                <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-850/60 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Ограничение по времени (сек)</label>
                      <input
                        type="number"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                        placeholder="300 (5 минут)"
                        value={activeStep.verificationData.duration || ''}
                        onChange={(e) => handleVerificationChange(activeStepIndex, 'duration', parseInt(e.target.value) || undefined)}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Действие после истечения времени</label>
                      <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300">
                        <option>Перейти на следующий этап (Штраф к XP)</option>
                        <option>Заблокировать квест на 10 минут</option>
                        <option>Провалить сюжет (Начать заново)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STAGE REWARD MATRIX */}
            <div className="space-y-4 pt-4 border-t border-slate-800/60">
              <h4 className="font-display font-bold text-xs text-slate-300 uppercase tracking-wider">Матрица наград и достижений</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Опыт за прохождение (XP)</label>
                  <input
                    type="number"
                    value={activeStep.reward.xp}
                    onChange={(e) => handleRewardChange(activeStepIndex, 'xp', parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white"
                    placeholder="100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Выдаваемый предмет</label>
                  <input
                    type="text"
                    value={activeStep.reward.item || ''}
                    onChange={(e) => handleRewardChange(activeStepIndex, 'item', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white"
                    placeholder="Например: Латунный ключ"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Выдаваемое достижение</label>
                  <input
                    type="text"
                    value={activeStep.reward.achievement || ''}
                    onChange={(e) => handleRewardChange(activeStepIndex, 'achievement', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-white"
                    placeholder="Например: Следопыт"
                  />
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-slate-900/20 border border-dashed border-slate-800 h-[650px] rounded-3xl flex flex-col items-center justify-center text-slate-500">
            <HelpCircle className="w-12 h-12 stroke-1 mb-2" />
            <p className="text-xs">Выберите этап квеста слева для редактирования или создайте новый.</p>
          </div>
        )}
      </div>

    </div>
  );
}
