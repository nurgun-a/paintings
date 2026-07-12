import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Compass, 
  MapPin, 
  QrCode, 
  Camera, 
  Award, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Code,
  Edit2
} from 'lucide-react';
import { QuestProject, QuestStep, StepType } from '../../packages/types/index';

interface QuestsTabProps {
  projects: QuestProject[];
  setProjects: (projects: QuestProject[]) => void;
}

export default function QuestsTab({ projects, setProjects }: QuestsTabProps) {
  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } as Record<string, string>;
    return fetch(url, { ...options, headers });
  };

  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Active step editor state
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  // STEP ACTIONS
  const handleSaveStep = (stepIndex: number, updatedStep: QuestStep) => {
    if (!currentProject) return;

    const updatedSteps = [...currentProject.steps];
    updatedSteps[stepIndex] = updatedStep;

    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        return { ...p, steps: updatedSteps };
      }
      return p;
    });

    setProjects(updatedProjects);
    setEditingStepIndex(null);
    saveProjectState(currentProject.id, updatedSteps);
  };

  const handleCreateStep = () => {
    if (!currentProject) return;

    const newStep: QuestStep = {
      id: `step-${Math.random().toString(36).substring(2, 7)}`,
      title: 'Новое испытание',
      description: 'Опишите загадку или задание для игрока...',
      type: 'TEXT',
      verificationData: { answers: ['правильно', 'да'] },
      reward: { xp: 100, item: '' }
    };

    const updatedSteps = [...currentProject.steps, newStep];
    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        return { ...p, steps: updatedSteps };
      }
      return p;
    });

    setProjects(updatedProjects);
    setEditingStepIndex(updatedSteps.length - 1);
    saveProjectState(currentProject.id, updatedSteps);
  };

  const handleDeleteStep = (index: number) => {
    if (!currentProject) return;
    if (!confirm('Вы действительно хотите удалить этот шаг квеста?')) return;

    const updatedSteps = currentProject.steps.filter((_, idx) => idx !== index);
    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        return { ...p, steps: updatedSteps };
      }
      return p;
    });

    setProjects(updatedProjects);
    saveProjectState(currentProject.id, updatedSteps);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!currentProject) return;
    const steps = [...currentProject.steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= steps.length) return;

    // Swap steps
    const temp = steps[index];
    steps[index] = steps[targetIdx];
    steps[targetIdx] = temp;

    const updatedProjects = projects.map(p => {
      if (p.id === currentProject.id) {
        return { ...p, steps };
      }
      return p;
    });

    setProjects(updatedProjects);
    saveProjectState(currentProject.id, steps);
  };

  const saveProjectState = async (id: string, steps: QuestStep[]) => {
    try {
      const fullProject = projects.find(p => p.id === id);
      if (!fullProject) return;

      await adminFetch(`/api/admin/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...fullProject, steps })
      });
    } catch (err) {
      console.error('Failed to sync steps with backend:', err);
    }
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12 text-slate-400">
        <Compass className="w-12 h-12 mx-auto stroke-1" />
        <p className="mt-2">Создайте проект во вкладке управления проектами, чтобы настраивать этапы.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="quests-workspace-tab">
      
      {/* TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight">Маршруты и Этапы квеста</h2>
          <p className="text-slate-400 text-sm">Проектируйте линейные или ветвящиеся цепочки загадок, настраивайте GPS-координаты и Vision AI.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-100 font-semibold focus:outline-none"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={handleCreateStep}
            className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить шаг</span>
          </button>
        </div>
      </div>

      {/* CORE TIMELINE STEPS LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TIMELINE COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          {currentProject.steps.length === 0 ? (
            <div className="text-center py-12 rounded-2xl bg-slate-800/10 border border-dashed border-slate-800 text-slate-400 space-y-3">
              <Compass className="w-12 h-12 mx-auto text-slate-500 stroke-1" />
              <div className="text-sm">В этом квесте еще нет шагов.</div>
              <button onClick={handleCreateStep} className="text-xs text-indigo-400 font-bold hover:underline">Создать первый шаг квеста &rarr;</button>
            </div>
          ) : (
            currentProject.steps.map((step, idx) => {
              const isActive = editingStepIndex === idx;
              return (
                <div 
                  key={step.id} 
                  className={`p-5 rounded-2xl transition-all border duration-300 relative group ${
                    isActive 
                      ? 'bg-slate-800/40 border-indigo-500/80 shadow-md shadow-indigo-500/5' 
                      : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    {/* Index Circle Indicator */}
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold font-mono text-xs text-indigo-400 shrink-0">
                      {idx + 1}
                    </div>

                    {/* Content info */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-extrabold text-base truncate">{step.title}</h4>
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Type Indicator */}
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono flex items-center gap-1 uppercase">
                            {step.type === 'TEXT' && <HelpCircle className="w-3 h-3 text-emerald-400" />}
                            {step.type === 'QR' && <QrCode className="w-3 h-3 text-amber-400" />}
                            {step.type === 'PHOTO' && <Camera className="w-3 h-3 text-pink-400" />}
                            {step.type === 'LOCATION' && <MapPin className="w-3 h-3 text-blue-400" />}
                            {step.type}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{step.description}</p>
                      
                      {/* Rewards summary indicators */}
                      <div className="flex flex-wrap gap-3 pt-2 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 text-amber-400 font-mono font-semibold">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          +{step.reward.xp} XP
                        </span>
                        {step.reward.item && (
                          <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-semibold">🎒 {step.reward.item}</span>
                        )}
                        {step.reward.achievement && (
                          <span className="px-1.5 py-0.5 bg-slate-800 rounded text-indigo-400 font-semibold">🏆 {step.reward.achievement}</span>
                        )}
                      </div>
                    </div>

                    {/* Inline step re-order controls */}
                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button onClick={() => handleMoveStep(idx, 'up')} className="p-1 hover:text-indigo-400 text-slate-500" disabled={idx === 0}><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleMoveStep(idx, 'down')} className="p-1 hover:text-indigo-400 text-slate-500" disabled={idx === currentProject.steps.length - 1}><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setEditingStepIndex(idx)} className="p-1 hover:text-indigo-400 text-slate-500" title="Редактировать"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteStep(idx)} className="p-1 hover:text-red-400 text-slate-500" title="Удалить"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* STEP INSPECTOR / DETAILED SETTING PANEL */}
        <div className="space-y-6">
          {editingStepIndex !== null && currentProject.steps[editingStepIndex] ? (
            <StepDetailEditor 
              step={currentProject.steps[editingStepIndex]} 
              onSave={(updated) => handleSaveStep(editingStepIndex, updated)}
              onCancel={() => setEditingStepIndex(null)}
            />
          ) : (
            <div className="p-6 rounded-2xl bg-slate-800/10 border border-dashed border-slate-800 text-center py-16 space-y-3">
              <Code className="w-10 h-10 text-slate-500 mx-auto stroke-1" />
              <h5 className="font-bold text-sm">Инспектор этапов</h5>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">Выберите конкретный шаг квеста, чтобы открыть детальную конфигурацию наград и критериев проверки.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

// NESTED STEP DETAIL EDITOR (Separated Component inside file)
interface StepDetailEditorProps {
  step: QuestStep;
  onSave: (step: QuestStep) => void;
  onCancel: () => void;
}

function StepDetailEditor({ step, onSave, onCancel }: StepDetailEditorProps) {
  const [title, setTitle] = useState(step.title);
  const [description, setDescription] = useState(step.description);
  const [type, setType] = useState<StepType>(step.type);
  
  // Rewards
  const [xp, setXp] = useState(step.reward.xp);
  const [item, setItem] = useState(step.reward.item || '');
  const [achievement, setAchievement] = useState(step.reward.achievement || '');

  // Verification Parameters (dynamic text strings)
  const [answersInput, setAnswersInput] = useState(step.verificationData.answers?.join(', ') || '');
  const [qrCodeExpected, setQrCodeExpected] = useState(step.verificationData.qrCode || '');
  const [referencePhoto, setReferencePhoto] = useState(step.verificationData.referenceImage || '');
  const [locationLat, setLocationLat] = useState(step.verificationData.coords?.lat || 55.75124);
  const [locationLng, setLocationLng] = useState(step.verificationData.coords?.lng || 37.61842);
  const [locationRadius, setLocationRadius] = useState(step.verificationData.coords?.radius || 50);

  const handleApplySave = () => {
    const answers = answersInput.split(',').map(a => a.trim().toLowerCase()).filter(a => a !== '');
    
    const updated: QuestStep = {
      ...step,
      title,
      description,
      type,
      verificationData: {
        answers: type === 'TEXT' ? answers : undefined,
        qrCode: type === 'QR' ? qrCodeExpected : undefined,
        referenceImage: type === 'PHOTO' ? referencePhoto : undefined,
        coords: type === 'LOCATION' ? { lat: locationLat, lng: locationLng, radius: locationRadius } : undefined
      },
      reward: {
        xp: Number(xp),
        item: item.trim() || undefined,
        achievement: achievement.trim() || undefined
      }
    };

    onSave(updated);
  };

  return (
    <div className="p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-5" id="step-detail-editor-card">
      <div className="flex justify-between items-center pb-3 border-b border-slate-800/60">
        <h4 className="font-bold text-sm uppercase tracking-wider text-slate-300">Настройка этапа</h4>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-300 text-xs font-semibold">Закрыть</button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Title */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase">Название шага</label>
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200" 
          />
        </div>

        {/* Description / Instructions */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase">Загадка / Задание (Markdown)</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 leading-relaxed" 
          />
        </div>

        {/* Step Type Selector */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 font-bold uppercase">Метод проверки выполнения</label>
          <select 
            value={type} 
            onChange={(e) => setType(e.target.value as StepType)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
          >
            <option value="TEXT">Текстовый ответ / загадка (TEXT)</option>
            <option value="QR">Сканирование QR-кода (QR)</option>
            <option value="PHOTO">Верификация Vision AI по фото (PHOTO)</option>
            <option value="LOCATION">Прибытие в GPS точку (LOCATION)</option>
          </select>
        </div>

        {/* DYNAMIC VERIFICATION PARAMETERS FIELDS */}
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
          <h5 className="font-bold text-[10px] uppercase text-indigo-400">Критерий верификации: {type}</h5>
          
          {type === 'TEXT' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold">Варианты ответов (через запятую)</label>
              <input 
                type="text" 
                value={answersInput}
                onChange={(e) => setAnswersInput(e.target.value)}
                placeholder="рысь, линкс, lynx"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none" 
              />
            </div>
          )}

          {type === 'QR' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold">Ожидаемый QR секретный код</label>
              <input 
                type="text" 
                value={qrCodeExpected}
                onChange={(e) => setQrCodeExpected(e.target.value)}
                placeholder="ICHCHI_SERGE_77"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none" 
              />
            </div>
          )}

          {type === 'PHOTO' && (
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500 font-bold">Описание эталона для Vision AI</label>
              <textarea 
                value={referencePhoto}
                onChange={(e) => setReferencePhoto(e.target.value)}
                placeholder="A photograph of real green forest trees, pine needles, or outdoor nature plants."
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none" 
              />
              <p className="text-[9px] text-slate-500">
                Игрок никогда не увидит это текстовое описание. ИИ сравнит присланный снимок с этим эталонным промптом на сервере.
              </p>
            </div>
          )}

          {type === 'LOCATION' && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Широта (Lat)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={locationLat}
                    onChange={(e) => setLocationLat(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold">Долгота (Lng)</label>
                  <input 
                    type="number" 
                    step="any"
                    value={locationLng}
                    onChange={(e) => setLocationLng(parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-bold">Радиус погрешности (Метры)</label>
                <input 
                  type="number" 
                  value={locationRadius}
                  onChange={(e) => setLocationRadius(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200" 
                />
              </div>
            </div>
          )}
        </div>

        {/* REWARDS AREA */}
        <div className="space-y-3">
          <h5 className="font-bold text-[10px] uppercase text-amber-500">Награды за прохождение</h5>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Опыт (XP)</label>
              <input 
                type="number" 
                value={xp} 
                onChange={(e) => setXp(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Предмет</label>
              <input 
                type="text" 
                value={item} 
                onChange={(e) => setItem(e.target.value)}
                placeholder="Амулет"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-slate-500">Ачивка</label>
              <input 
                type="text" 
                value={achievement} 
                onChange={(e) => setAchievement(e.target.value)}
                placeholder="Искатель"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs text-slate-200" 
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-800/60 flex justify-end gap-2">
          <button onClick={onCancel} className="py-2 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold">Отмена</button>
          <button onClick={handleApplySave} className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Применить
          </button>
        </div>

      </div>
    </div>
  );
}
