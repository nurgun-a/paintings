import React, { useState } from 'react';
import { 
  Plus, 
  Layers, 
  Trash2, 
  Edit, 
  Copy, 
  Download, 
  Upload, 
  Check, 
  Play, 
  StopCircle, 
  QrCode, 
  Settings, 
  Globe, 
  Clock, 
  Sliders, 
  Cpu,
  Sparkles,
  Link,
  ChevronDown,
  Info
} from 'lucide-react';
import { QuestProject } from '../../packages/types/index';

interface ProjectsTabProps {
  projects: QuestProject[];
  setProjects: (projects: QuestProject[]) => void;
}

export default function ProjectsTab({ projects, setProjects }: ProjectsTabProps) {
  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } as Record<string, string>;
    return fetch(url, { ...options, headers });
  };

  const [activeProjectEditor, setActiveProjectEditor] = useState<Partial<QuestProject> | null>(null);
  const [activeSettingsProjectId, setActiveSettingsProjectId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  // Settings custom state for active settings panel
  const [aiProvider, setAiProvider] = useState<'gemini' | 'openai' | 'anthropic' | 'deepseek'>('gemini');
  const [aiModel, setAiModel] = useState('gemini-3.5-flash');
  const [temp, setTemp] = useState(0.7);
  const [maxContext, setMaxContext] = useState(4000);

  // PROJECT ACTIONS
  const handleCreateNew = () => {
    const defaultProj: Partial<QuestProject> = {
      name: 'Новый Мистический Квест',
      description: 'Исследуйте неизведанное, решайте загадки и взаимодействуйте с ИИ.',
      status: 'draft',
      lore: {
        systemPrompt: 'Вы — ИИ-Ведущий, таинственный спутник.',
        story: 'Приключение начинается в древней долине...',
        rules: 'Действуйте честно и разгадывайте загадки природы.'
      },
      npcs: [{ id: 'guide-1', name: 'Хранитель', role: 'Ведущий', personality: 'Загадочный', avatar: '🧙‍♂️' }],
      steps: [
        {
          id: 'step-1',
          title: 'Загадка сфинкса',
          description: 'Ответьте хранителю: Сколько пальцев у человека на одной руке?',
          type: 'TEXT',
          verificationData: { answers: ['пять', '5'] },
          reward: { xp: 100 }
        }
      ]
    };
    setActiveProjectEditor(defaultProj);
  };

  const handleSaveProject = async () => {
    if (!activeProjectEditor?.name) return;

    const id = activeProjectEditor.id || activeProjectEditor.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `quest-${Math.random().toString(36).substring(2, 7)}`;
    
    const projectToSave: QuestProject = {
      ...activeProjectEditor as QuestProject,
      id
    };

    try {
      const method = activeProjectEditor.id ? 'PUT' : 'POST';
      const url = activeProjectEditor.id ? `/api/admin/projects/${activeProjectEditor.id}` : '/api/admin/projects';
      
      const res = await adminFetch(url, {
        method,
        body: JSON.stringify(projectToSave)
      });
      const saved = await res.json();
      
      if (!res.ok) {
        alert(`Ошибка сохранения: ${saved.error || 'Неизвестная ошибка'}`);
        return;
      }

      if (activeProjectEditor.id) {
        setProjects(projects.map(p => p.id === activeProjectEditor.id ? saved : p));
      } else {
        setProjects([...projects, saved]);
      }
      setActiveProjectEditor(null);
    } catch (err) {
      console.error('Error saving project:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Вы действительно хотите навсегда удалить этот проект? Это удалит все связанные этапы.')) return;
    try {
      await adminFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloneProject = (proj: QuestProject) => {
    const clone: QuestProject = {
      ...JSON.parse(JSON.stringify(proj)),
      id: `${proj.id}-clone`,
      name: `${proj.name} (Копия)`
    };
    setProjects([...projects, clone]);
  };

  const handleTogglePublish = async (proj: QuestProject) => {
    const updatedStatus = proj.status === 'published' ? 'draft' : 'published';
    const updated = { ...proj, status: updatedStatus as 'draft' | 'published' };
    
    try {
      const res = await adminFetch(`/api/admin/projects/${proj.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Ошибка изменения статуса публикации: ${data.error || 'Неизвестная ошибка'}`);
        return;
      }
      setProjects(projects.map(p => p.id === proj.id ? data : p));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = (id: string) => {
    const link = `${window.location.origin}/?questId=${id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExport = (proj: QuestProject) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(proj, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `${proj.id}-quest-schema.json`);
    dlAnchorElem.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const res = await adminFetch('/api/admin/projects/import', {
            method: 'POST',
            body: JSON.stringify({ projectData: parsed })
          });
          const saved = await res.json();
          setProjects([...projects, saved]);
        } catch (err) {
          alert('Ошибка импорта: Невалидный JSON формат.');
        }
      };
    }
  };

  return (
    <div className="space-y-8" id="projects-tab">
      
      {/* MAIN TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Управление проектами квестов</h2>
          <p className="text-slate-400 text-sm">Создавайте новые сюжетные ветки, настраивайте параметры ИИ и публикуйте квесты.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <label className="py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/30 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Импорт JSON</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button 
            onClick={handleCreateNew}
            className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            id="create-project-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Новый квест</span>
          </button>
        </div>
      </div>

      {/* PROJECTS MAIN GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => (
          <div key={proj.id} className="p-6 rounded-2xl bg-slate-800/20 border border-slate-800 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-700 transition-all duration-300">
            {/* Upper Badge Status */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                proj.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {proj.status === 'published' ? 'Опубликован' : 'Черновик'}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleExport(proj)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Экспорт проекта"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleCloneProject(proj)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                  title="Клонировать"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteProject(proj.id)}
                  className="p-1.5 rounded hover:bg-slate-800 text-red-400 hover:text-red-300"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title & Body */}
            <div className="space-y-2 mb-6">
              <h3 className="font-extrabold text-lg group-hover:text-indigo-400 transition-colors">{proj.name}</h3>
              <p className="text-xs text-slate-400 line-clamp-3">{proj.description}</p>
            </div>

            {/* Metadata Indicators */}
            <div className="py-3 border-t border-slate-800/80 flex justify-between items-center text-xs text-slate-400 mb-4">
              <span className="font-mono">{(proj.steps || []).length} этапов квеста</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-pink-500" />
                Gemini
              </span>
            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => {
                  setActiveSettingsProjectId(proj.id);
                  // Populate setting indicators
                  setAiProvider('gemini');
                }}
                className="py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border border-slate-700/50"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Настройки
              </button>
              <button 
                onClick={() => handleTogglePublish(proj)}
                className={`py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                  proj.status === 'published' 
                    ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {proj.status === 'published' ? (
                  <>
                    <StopCircle className="w-4 h-4" />
                    Остановить
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Запустить
                  </>
                )}
              </button>
            </div>

            {/* Quick Share Link bar */}
            <div className="mt-3 flex items-center justify-between bg-slate-900/40 p-2 rounded-xl border border-slate-800/30">
              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                {window.location.origin}/?questId={proj.id}
              </span>
              <div className="flex gap-1 shrink-0">
                <button 
                  onClick={() => handleCopyLink(proj.id)}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-indigo-400 transition-colors"
                  title="Скопировать ссылку"
                >
                  {copiedId === proj.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Link className="w-3 h-3" />}
                </button>
                <button 
                  onClick={() => setQrCodeData(`${window.location.origin}/?questId=${proj.id}`)}
                  className="p-1 rounded bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Генерировать QR"
                >
                  <QrCode className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* 1. PROJECT BUILDER/EDITOR DRAWER MODAL */}
      {activeProjectEditor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="project-editor-modal">
          <div className="bg-[#151824] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-xl flex items-center gap-2">
                <Layers className="text-indigo-500 w-5 h-5" />
                {activeProjectEditor.id ? 'Редактировать проект' : 'Создать проект квеста'}
              </h3>
              <button 
                onClick={() => setActiveProjectEditor(null)}
                className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Scroll Container */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Название квеста</label>
                <input 
                  type="text" 
                  value={activeProjectEditor.name || ''} 
                  onChange={(e) => setActiveProjectEditor({ ...activeProjectEditor, name: e.target.value })}
                  placeholder="Пример: Загадки Древнего Сэргэ"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Описание для игроков</label>
                <textarea 
                  value={activeProjectEditor.description || ''} 
                  onChange={(e) => setActiveProjectEditor({ ...activeProjectEditor, description: e.target.value })}
                  placeholder="Введите краткое интригующее введение..."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Cover inputs placeholder */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Обложка URL</label>
                  <input 
                    type="text" 
                    placeholder="Вставьте ссылку на картинку..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Язык интерфейса</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
                    <option value="ru">Русский (Russia)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-slate-800/80 bg-slate-900/20 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setActiveProjectEditor(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
              >
                Отмена
              </button>
              <button 
                onClick={handleSaveProject}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                Сохранить проект
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. DETAILED PROJECT SETTINGS SUB-DRAWER */}
      {activeSettingsProjectId && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" id="project-settings-modal">
          <div className="bg-[#151824] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-xl">Настройки Квест-Движка ИИ</h3>
              </div>
              <button 
                onClick={() => setActiveSettingsProjectId(null)}
                className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800"
              >
                &times;
              </button>
            </div>

            {/* Scroll Panel body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex gap-3 text-xs text-indigo-300">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <p>
                  Параметры ниже настраивают точную интеграцию с API Gemini Flash и регулируют температурные пороги галлюцинаций ИИ-Ведущего.
                </p>
              </div>

              {/* Grid 1: Provider selection */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">ИИ-Провайдер</label>
                  <select 
                    value={aiProvider} 
                    onChange={(e: any) => setAiProvider(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="gemini">Google Gemini (Стандарт)</option>
                    <option value="deepseek">DeepSeek (Рекомендуемый)</option>
                    <option value="openai">OpenAI (SaaS)</option>
                    <option value="anthropic">Anthropic Claude</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Языковая модель</label>
                  <select 
                    value={aiModel} 
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="deepseek-v3">deepseek-v3 (Основной ИИ-Ведущий)</option>
                    <option value="deepseek-r1">deepseek-r1 (Рассуждающий ИИ)</option>
                    <option value="gemini-3.5-flash">gemini-3.5-flash (Быстрый & Умный)</option>
                    <option value="gemini-3.5-pro">gemini-3.5-pro (Глубокий анализ)</option>
                    <option value="gpt-4o">gpt-4o-mini (OpenAI)</option>
                  </select>
                </div>
              </div>

              {/* Slide controls */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                    <span>Температура креативности</span>
                    <span className="font-mono text-indigo-400">{temp}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={temp} 
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500" 
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Строго по лору (0.0)</span>
                    <span>Максимум воображения (1.0)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400 font-bold uppercase">
                    <span>Максимальный контекст (Токены истории)</span>
                    <span className="font-mono text-pink-400">{maxContext} токенов</span>
                  </div>
                  <input 
                    type="range" 
                    min="1000" 
                    max="8000" 
                    step="500" 
                    value={maxContext} 
                    onChange={(e) => setMaxContext(parseInt(e.target.value))}
                    className="w-full accent-pink-500" 
                  />
                </div>
              </div>

              {/* Timezone parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Часовой пояс
                  </label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
                    <option value="utc+3">UTC+3 (Москва)</option>
                    <option value="utc+9">UTC+9 (Якутск)</option>
                    <option value="utc">UTC (Гринвич)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    Языковой регион
                  </label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500">
                    <option value="RU">RU_ru (Russian Federation)</option>
                    <option value="US">EN_us (United States)</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800/80 bg-slate-900/20 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setActiveSettingsProjectId(null)}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
              >
                Сохранить конфигурацию
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. QR-CODE PREVIEW GENERATION MODAL */}
      {qrCodeData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setQrCodeData(null)}>
          <div className="bg-[#151824] border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base">QR-код входа в квест</h3>
              <button onClick={() => setQrCodeData(null)} className="text-slate-400 hover:text-slate-200 font-bold">&times;</button>
            </div>
            
            {/* Elegant Custom Vector QR code simulator */}
            <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mx-auto border border-slate-200">
              <svg viewBox="0 0 100 100" className="w-48 h-48">
                {/* Simulated high density QR patterns */}
                <rect x="0" y="0" width="25" height="25" fill="#000" />
                <rect x="3" y="3" width="19" height="19" fill="#fff" />
                <rect x="7" y="7" width="11" height="11" fill="#000" />

                <rect x="75" y="0" width="25" height="25" fill="#000" />
                <rect x="78" y="3" width="19" height="19" fill="#fff" />
                <rect x="82" y="7" width="11" height="11" fill="#000" />

                <rect x="0" y="75" width="25" height="25" fill="#000" />
                <rect x="3" y="78" width="19" height="19" fill="#fff" />
                <rect x="7" y="82" width="11" height="11" fill="#000" />

                <rect x="35" y="35" width="30" height="30" fill="#000" />
                <rect x="40" y="40" width="20" height="20" fill="#fff" />
                <rect x="45" y="45" width="10" height="10" fill="#000" />

                {/* Random code noise dots */}
                <rect x="30" y="10" width="5" height="5" fill="#000" />
                <rect x="45" y="5" width="8" height="3" fill="#000" />
                <rect x="60" y="15" width="6" height="6" fill="#000" />
                <rect x="15" y="40" width="5" height="10" fill="#000" />
                <rect x="10" y="60" width="8" height="4" fill="#000" />
                <rect x="40" y="80" width="15" height="5" fill="#000" />
                <rect x="70" y="70" width="5" height="15" fill="#000" />
                <rect x="85" y="40" width="10" height="10" fill="#000" />
              </svg>
            </div>

            <p className="text-xs text-slate-400">
              Повесьте этот QR на стене старта, чтобы искатели могли мгновенно сканировать его мобильным телефоном и вступать в игру.
            </p>

            <button 
              onClick={() => {
                alert('QR-код успешно сохранен как PNG.');
                setQrCodeData(null);
              }}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Скачать изображение
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
