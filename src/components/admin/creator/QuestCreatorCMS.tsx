import React, { useState, useEffect } from 'react';
import { 
  Plus, Sparkles, Folder, Save, Smartphone, Settings, Globe, ShieldAlert, FileCode, Sliders, Users, ChevronRight, Download, Upload, Trash2 
} from 'lucide-react';

import { CMSProject } from './types';
import { QUEST_TEMPLATES } from './TemplatesLibrary';
import GeneralInfoTab from './CMSTabs/GeneralInfoTab';
import LoreAndNPCsTab from './CMSTabs/LoreAndNPCsTab';
import QuestsAndEventsTab from './CMSTabs/QuestsAndEventsTab';
import ItemsAndLevelsTab from './CMSTabs/ItemsAndLevelsTab';
import AISettingsTab from './CMSTabs/AISettingsTab';
import PublishAndValidateTab from './CMSTabs/PublishAndValidateTab';
import CMSSimulator from './CMSSimulator';

export default function QuestCreatorCMS() {
  const [projects, setProjects] = useState<CMSProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'lore' | 'npcs' | 'quests' | 'rewards' | 'ai' | 'publish' | 'simulator'>('info');
  
  // Collaborative Role Roleplay simulation
  const [userRole, setUserRole] = useState<'owner' | 'writer' | 'translator' | 'moderator'>('writer');
  const [coWorkersCount, setCoWorkersCount] = useState(2);

  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } as Record<string, string>;
    return fetch(url, { ...options, headers });
  };

  // Load projects from DB
  const loadProjects = async () => {
    try {
      const res = await adminFetch('/api/admin/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects inside CMS:', err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  // Visual state updates & autosave mechanism
  const handleUpdateActiveProject = async (updatedFields: Partial<CMSProject>) => {
    if (!selectedProjectId || !activeProject) return;

    const updatedProject = {
      ...activeProject,
      ...updatedFields
    };

    // Immediate reactive local state update
    setProjects(projects.map(p => p.id === selectedProjectId ? updatedProject : p));

    // Save to server
    try {
      await adminFetch(`/api/admin/projects/${selectedProjectId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedProject)
      });
    } catch (err) {
      console.error('Autosave failure:', err);
    }
  };

  // Create Project from visual template
  const handleCreateFromTemplate = async (templateId: string) => {
    const template = QUEST_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;

    const baseData = template.data;
    const cleanId = `${template.id}-${Math.random().toString(36).substring(2, 7)}`;
    const newProject: CMSProject = {
      ...baseData as CMSProject,
      id: cleanId,
      name: `${baseData.name} (${new Date().toLocaleDateString()})`,
      status: 'draft',
      versionString: '1.0.0'
    };

    try {
      const res = await adminFetch('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify(newProject)
      });
      if (res.ok) {
        const saved = await res.json();
        setProjects([...projects, saved]);
        setSelectedProjectId(saved.id);
        setActiveTab('info');
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn('Failed to instantiate template on server, fallback to local creation:', err);
      // Fallback: save to local list so they are never blocked from creating/editing!
      setProjects([...projects, newProject]);
      setSelectedProjectId(newProject.id);
      setActiveTab('info');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Вы действительно хотите удалить этот проект во всех базах данных? Восстановить его будет невозможно.')) return;
    try {
      const res = await adminFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      setSelectedProjectId(updated.length > 0 ? updated[0].id : null);
    } catch (err) {
      console.error(err);
      const updated = projects.filter(p => p.id !== id);
      setProjects(updated);
      setSelectedProjectId(updated.length > 0 ? updated[0].id : null);
    }
  };

  return (
    <div className="space-y-6" id="quest-creator-cms-root">
      
      {/* CMS HEADER DASHBOARD */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💫</span>
            <h1 className="text-2xl font-black tracking-tight text-white">No-Code Quest Creator CMS</h1>
          </div>
          <p className="text-xs text-slate-400">Профессиональная среда визуального моделирования сценариев квестов для авторов, методистов и продюсеров.</p>
        </div>

        {/* Co-working Emulator Indicators & Role control */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-850 p-2.5 rounded-2xl text-xs font-mono">
          <div className="flex items-center gap-2 text-indigo-400 animate-pulse">
            <Users className="w-4 h-4" />
            <span>Соавторов онлайн: {coWorkersCount}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 uppercase block">Ваша Роль</span>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as any)}
              className="bg-transparent border-none text-white font-semibold focus:outline-none focus:ring-0 text-xs p-0 cursor-pointer"
            >
              <option value="owner" className="bg-slate-950 text-white">Владелец (Owner)</option>
              <option value="writer" className="bg-slate-950 text-white">Сценарист (Scenario Writer)</option>
              <option value="translator" className="bg-slate-950 text-white">Переводчик (Translator)</option>
              <option value="moderator" className="bg-slate-950 text-white">Viewer / Наставник</option>
            </select>
          </div>
        </div>
      </div>

      {/* NO ACTIVE PROJECTS WINDOW (SHOWS CREATION LIBRARY & TEMPLATES) */}
      {!selectedProjectId ? (
        <div className="space-y-8">
          
          <div className="bg-slate-900/40 border border-dashed border-slate-800 p-12 rounded-3xl text-center space-y-4">
            <Folder className="w-16 h-16 text-slate-600 mx-auto stroke-1" />
            <div className="space-y-1 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-white font-display">База данных квестов пуста</h2>
              <p className="text-xs text-slate-400 leading-relaxed">Создайте ваш первый визуальный ИИ-квест, используя один из оптимизированных шаблонов ниже. Сценаристу не потребуется править код!</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-display font-extrabold text-lg text-white">Выберите стартовую модель квеста</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {QUEST_TEMPLATES.map((tpl) => (
                <div key={tpl.id} className="bg-slate-900 border border-slate-850 hover:border-indigo-500/50 p-6 rounded-3xl flex flex-col justify-between transition-all group hover:shadow-lg">
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">{tpl.category}</span>
                    <h4 className="font-display font-bold text-base text-white group-hover:text-indigo-400 transition-colors">{tpl.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
                  </div>
                  
                  <button
                    onClick={() => handleCreateFromTemplate(tpl.id)}
                    className="w-full mt-6 py-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-white rounded-xl text-xs font-bold text-slate-400 flex items-center justify-center gap-1 transition-all"
                  >
                    Активировать этот шаблон <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* CORE CMS EDITOR INTERFACE */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* SIDE PANEL: PROJECTS SELECTOR (xl:col-span-3) */}
          <div className="xl:col-span-3 bg-slate-900/80 border border-slate-850 p-4 rounded-3xl space-y-4 h-[720px] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Проекты квестов</span>
              
              <button
                onClick={() => handleCreateFromTemplate('city-quest')}
                className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                title="Добавить новый проект"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProjectId(p.id); setActiveTab('info'); }}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative group ${
                    selectedProjectId === p.id
                      ? 'bg-slate-850 border-indigo-500/80'
                      : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div className="flex gap-2.5 items-center">
                    <span className="text-2xl shrink-0">{(p as any).icon || '🔮'}</span>
                    <div className="space-y-0.5 overflow-hidden">
                      <span className="font-bold text-xs text-white truncate block">{p.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{p.steps?.length || 0} шагов • {p.status === 'published' ? '🟢 Published' : '🟡 Draft'}</span>
                    </div>
                  </div>

                  {/* Delete project check */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteProject(p.id); }}
                    className="absolute right-2 top-3 p-1.5 bg-slate-900/80 rounded-lg border border-red-950 text-red-500 hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Удалить проект"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Template presets shortcut link */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedProjectId(null);
                }}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
              >
                🌌 Перейти в библиотеку шаблонов
              </button>
            </div>
          </div>

          {/* MAIN EDITOR WORKSPACE (xl:col-span-9) */}
          <div className="xl:col-span-9 space-y-6">
            
            {/* ACTIVE PROJECT QUICK ACTION HEADBAR */}
            {activeProject && (
              <div className="bg-slate-900 border border-slate-850 p-4 rounded-3xl flex flex-wrap gap-1.5 items-center justify-between">
                
                {/* Tabs navigation bar */}
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => setActiveTab('info')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    ⚙️ Инфо
                  </button>
                  <button
                    onClick={() => setActiveTab('lore')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'lore' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    📖 Лор
                  </button>
                  <button
                    onClick={() => setActiveTab('quests')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'quests' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    🗺️ Квесты и Шаги
                  </button>
                  <button
                    onClick={() => setActiveTab('rewards')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'rewards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    🎒 Предметы & Ранги
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    🧠 ИИ-Ведущий
                  </button>
                  <button
                    onClick={() => setActiveTab('publish')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === 'publish' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    🚀 Выпуск
                  </button>
                </div>

                {/* Instant Simulator testing mode trigger */}
                <button
                  onClick={() => setActiveTab(activeTab === 'simulator' ? 'info' : 'simulator')}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${
                    activeTab === 'simulator' 
                      ? 'bg-amber-600 border-amber-500 text-white animate-pulse' 
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800 text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  {activeTab === 'simulator' ? 'Выйти из теста' : 'Тест в Симуляторе'}
                </button>
              </div>
            )}

            {/* TAB OUTLET INTERFACE */}
            {activeProject && (
              <div className="space-y-6">
                {activeTab === 'info' && (
                  <GeneralInfoTab
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                  />
                )}
                {activeTab === 'lore' && (
                  <LoreAndNPCsTab
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                  />
                )}
                {activeTab === 'quests' && (
                  <QuestsAndEventsTab
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                  />
                )}
                {activeTab === 'rewards' && (
                  <ItemsAndLevelsTab
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                  />
                )}
                {activeTab === 'ai' && (
                  <AISettingsTab
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                  />
                )}
                {activeTab === 'publish' && (
                  <PublishAndValidateTab
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                    onPublish={(ver) => handleUpdateActiveProject({ versionString: ver, status: 'published' })}
                  />
                )}
                {activeTab === 'simulator' && (
                  <CMSSimulator project={activeProject} />
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
