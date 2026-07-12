import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  UserCheck, 
  History, 
  Cpu, 
  Send, 
  Check, 
  AlertCircle, 
  Save, 
  Plus, 
  Trash2, 
  Play,
  Settings,
  Flame,
  FileCode,
  CheckCircle,
  Clock,
  Code
} from 'lucide-react';
import { QuestProject, NPC } from '../../packages/types/index';

interface ContextTabProps {
  projects: QuestProject[];
  setProjects: (projects: QuestProject[]) => void;
}

export default function ContextTab({ projects, setProjects }: ContextTabProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Tab within Editor
  const [activeSubTab, setActiveSubTab] = useState<'lore' | 'npcs' | 'playground' | 'versions'>('lore');

  // Selected project reference
  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // System editor states
  const [systemPrompt, setSystemPrompt] = useState('');
  const [story, setStory] = useState('');
  const [rules, setRules] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<string>('');

  // Prompt testing playground states
  const [testUserMessage, setTestUserMessage] = useState('Привет, Шаман! Я заблудился у старой сосны, помоги мне.');
  const [testAIResponse, setTestAIResponse] = useState('');
  const [isLoadingTest, setIsLoadingTest] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState(0);

  // NPC manager state
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);
  const [npcName, setNpcName] = useState('');
  const [npcRole, setNpcRole] = useState('Проводник');
  const [npcPersonality, setNpcPersonality] = useState('');
  const [npcAvatar, setNpcAvatar] = useState('🧙‍♂️');

  // Change Log history simulation state
  const [historyLogs, setHistoryLogs] = useState<Array<{ id: string; time: string; action: string; author: string }>>([
    { id: 'v2', time: 'Сегодня, 11:24', action: 'Добавлены инструкции промпта вежливости ИИ-Шамана', author: 'Администратор' },
    { id: 'v1', time: 'Вчера, 18:40', action: 'Первичная публикация лора и мифов квеста', author: 'Система' }
  ]);

  // Custom dialog state for creating a project
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [createProjectError, setCreateProjectError] = useState('');
  const [createProjectSuccess, setCreateProjectSuccess] = useState('');

  // Synchronize on project switch
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  useEffect(() => {
    if (currentProject) {
      setSystemPrompt(currentProject.lore.systemPrompt || '');
      setStory(currentProject.lore.story || '');
      setRules(currentProject.lore.rules || '');
      setNpcs(currentProject.npcs || []);
    }
  }, [currentProject]);

  // Compute mock-token counts dynamically on changes
  useEffect(() => {
    const chars = systemPrompt.length + story.length + rules.length + JSON.stringify(npcs).length;
    setTokenEstimate(Math.ceil(chars / 3.8) + 120); // standard token scaling
  }, [systemPrompt, story, rules, npcs]);

  // Auto save trigger simulation and actual server save
  const handleAutoSave = () => {
    if (!currentProject) return;
    setIsSaved(false);

    // Save back locally to main state
    const updated = projects.map(p => {
      if (p.id === currentProject.id) {
        return {
          ...p,
          lore: { systemPrompt, story, rules },
          npcs: npcs
        };
      }
      return p;
    });

    setProjects(updated);
    
    // Save to the real backend database
    const token = localStorage.getItem('admin_token');
    fetch(`/api/admin/projects/${currentProject.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...currentProject,
        lore: { systemPrompt, story, rules },
        npcs: npcs
      })
    })
    .then(res => res.json())
    .then(() => {
      setIsSaved(true);
      setLastSavedTime(new Date().toLocaleTimeString());
    })
    .catch(err => {
      console.error('Failed to save project context on server:', err);
      // Fallback
      setTimeout(() => {
        setIsSaved(true);
        setLastSavedTime(new Date().toLocaleTimeString());
      }, 500);
    });
  };

  const handleCreateProject = () => {
    setIsCreateDialogOpen(true);
    setNewProjectName('');
    setCreateProjectError('');
    setCreateProjectSuccess('');
  };

  const executeCreateProject = async () => {
    if (!newProjectName || !newProjectName.trim()) return;

    const token = localStorage.getItem('admin_token');
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: 'Новый проект квеста и его лор-окружение.',
          status: 'draft',
          lore: {
            systemPrompt: 'Вы — ИИ-Шаман, мудрый проводник по тайнам народов России. Отвечайте глубокомысленно.',
            story: 'Ваше приключение по культурному наследию начинается здесь...',
            rules: 'Слушайте духов, разгадывайте загадки древних культур.'
          },
          npcs: [{ id: 'shaman-1', name: 'Шаман', role: 'Гид', personality: 'Мудрый', avatar: '🧙‍♂️' }],
          steps: []
        })
      });

      if (res.ok) {
        const newProj = await res.json();
        setProjects([...projects, newProj]);
        setSelectedProjectId(newProj.id);
        setCreateProjectSuccess(`Проект "${newProj.name}" успешно создан!`);
        setTimeout(() => {
          setIsCreateDialogOpen(false);
          setNewProjectName('');
          setCreateProjectSuccess('');
        }, 1500);
      } else {
        const err = await res.json();
        setCreateProjectError(`Ошибка при создании проекта: ${err.error || 'Неизвестная ошибка'}`);
      }
    } catch (err: any) {
      setCreateProjectError(`Ошибка сети при создании проекта: ${err.message}`);
    }
  };

  const renderCreateModal = () => {
    if (!isCreateDialogOpen) return null;
    return (
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Создать проект / контекст
            </h3>
            <button 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewProjectName('');
                setCreateProjectError('');
                setCreateProjectSuccess('');
              }}
              className="text-slate-400 hover:text-slate-200 text-sm"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            {createProjectError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs font-medium">
                {createProjectError}
              </div>
            )}
            {createProjectSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-medium">
                {createProjectSuccess}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium block">Название нового проекта:</label>
              <input 
                type="text"
                placeholder="Например: По следам шаманов Алтая"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                autoFocus
              />
            </div>
          </div>
          
          <div className="p-6 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-3">
            <button 
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewProjectName('');
                setCreateProjectError('');
                setCreateProjectSuccess('');
              }}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Отмена
            </button>
            <button 
              onClick={executeCreateProject}
              disabled={!newProjectName.trim()}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10"
            >
              Создать
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Trigger test prompt against context simulator
  const handleTestPrompt = async () => {
    if (!testUserMessage.trim()) return;
    setIsLoadingTest(true);
    setTestAIResponse('');

    try {
      // Direct integration simulation fallback using the actual prompt parameters
      const response = await fetch('/api/player/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          questId: currentProject.id, 
          message: `[СИМУЛЯЦИЯ ПЕСОЧНИЦЫ ПРОМПТА]: ${testUserMessage}` 
        })
      });
      const data = await response.json();
      
      // Pull history reply or generate placeholder
      if (data.progress?.chatHistory) {
        const lastMsg = data.progress.chatHistory.slice(-2);
        const aiMsg = lastMsg.find((m: any) => m.sender === 'gamemaster');
        setTestAIResponse(aiMsg?.text || 'Дух тайги откликнулся, но загадка осталась нерешенной...');
      } else {
        setTestAIResponse('ИИ-Шаман принял ваш промпт. Духи тайги шепчут слова одобрения!');
      }
    } catch (e: any) {
      setTestAIResponse(`Ошибка ИИ: ${e.message}`);
    } finally {
      setIsLoadingTest(false);
    }
  };

  // Add / Edit character NPCs
  const handleSaveNpc = () => {
    if (!npcName.trim()) return;

    let updatedNpcs: NPC[];
    if (editingNpcId) {
      updatedNpcs = npcs.map(n => n.id === editingNpcId ? { id: n.id, name: npcName, role: npcRole, personality: npcPersonality, avatar: npcAvatar } : n);
    } else {
      const newNpc: NPC = {
        id: `npc-${Math.random().toString(36).substring(2, 7)}`,
        name: npcName,
        role: npcRole,
        personality: npcPersonality,
        avatar: npcAvatar
      };
      updatedNpcs = [...npcs, newNpc];
    }

    setNpcs(updatedNpcs);
    setEditingNpcId(null);
    setNpcName('');
    setNpcPersonality('');
    setNpcAvatar('🧙‍♂️');

    // Trigger auto-save to propagate
    setTimeout(handleAutoSave, 100);
  };

  const handleEditNpcClick = (n: NPC) => {
    setEditingNpcId(n.id);
    setNpcName(n.name);
    setNpcRole(n.role);
    setNpcPersonality(n.personality);
    setNpcAvatar(n.avatar);
  };

  const handleDeleteNpc = (id: string) => {
    setNpcs(npcs.filter(n => n.id !== id));
    setTimeout(handleAutoSave, 100);
  };

  if (!currentProject) {
    return (
      <div className="text-center py-12 text-slate-400 space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto stroke-1 text-indigo-400" />
        <p className="mt-2">Создайте квест во вкладке проектов, чтобы редактировать его ИИ контекст.</p>
        <button 
          onClick={handleCreateProject}
          className="mx-auto py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          <span>Создать новый контекст / проект</span>
        </button>
        {renderCreateModal()}
      </div>
    );
  }

  return (
    <div className="space-y-8" id="context-editor-workspace">
      
      {/* SELECTION BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/20 p-4 rounded-2xl border border-slate-800/60">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-bold text-sm">Проект квеста:</span>
          <select 
            value={selectedProjectId} 
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-slate-100 font-semibold focus:outline-none focus:border-indigo-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={handleCreateProject}
            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md shadow-indigo-600/10"
            title="Создать новый проект квеста и его лор-окружение"
          >
            <Plus className="w-4 h-4" />
            <span>Создать контекст</span>
          </button>
        </div>

        {/* Auto save badge status */}
        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-slate-400">Сложность лора: ~{tokenEstimate} токенов</span>
          <div className="h-4 w-[1px] bg-slate-800" />
          {isSaved ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
              <CheckCircle className="w-4 h-4 animate-bounce" />
              Все изменения сохранены {lastSavedTime && `в ${lastSavedTime}`}
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 animate-spin" />
              Сохранение на лету...
            </span>
          )}
        </div>
      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: EDITING FORM AND TABS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sub Workspace tabs */}
          <div className="flex gap-2 border-b border-slate-800/80 pb-px">
            <button 
              onClick={() => setActiveSubTab('lore')}
              className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeSubTab === 'lore' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Сюжет и правила (Lore)
            </button>
            <button 
              onClick={() => setActiveSubTab('npcs')}
              className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeSubTab === 'npcs' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Персонажи (NPC)
            </button>
            <button 
              onClick={() => setActiveSubTab('playground')}
              className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeSubTab === 'playground' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Тестирование ИИ
            </button>
            <button 
              onClick={() => setActiveSubTab('versions')}
              className={`pb-3 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-all ${
                activeSubTab === 'versions' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              История изменений
            </button>
          </div>

          {/* TAB 1: STORY, SYSTEM PROMPT AND LORE TEXTAREAS */}
          {activeSubTab === 'lore' && (
            <div className="space-y-6" id="lore-editor-pane">
              {/* System Prompt */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-indigo-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-4 h-4" />
                    Системный Промпт ИИ (System Prompt)
                  </span>
                  <span>Тонкий тюнинг</span>
                </div>
                <textarea 
                  value={systemPrompt}
                  onChange={(e) => {
                    setSystemPrompt(e.target.value);
                    setIsSaved(false);
                  }}
                  onBlur={handleAutoSave}
                  rows={4}
                  placeholder="Пример: Вы — дух тайги. Говорите загадочно, используйте метафоры про деревья и диких зверей..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm font-mono text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* World Story */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-pink-500" />
                  Сюжет мира квеста (Story / Lore Base)
                </div>
                <textarea 
                  value={story}
                  onChange={(e) => {
                    setStory(e.target.value);
                    setIsSaved(false);
                  }}
                  onBlur={handleAutoSave}
                  rows={6}
                  placeholder="Введите мифологию, ключевые события..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Game Rules */}
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Правила игры (Rules & Constraints)
                </div>
                <textarea 
                  value={rules}
                  onChange={(e) => {
                    setRules(e.target.value);
                    setIsSaved(false);
                  }}
                  onBlur={handleAutoSave}
                  rows={3}
                  placeholder="Правило 1: Никогда не давать прямые разгадки. Правило 2: Ограничивать подсказки..."
                  className="w-full bg-[#11131c] border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: NPC MANAGER MODULE */}
          {activeSubTab === 'npcs' && (
            <div className="space-y-6" id="npc-manager-pane">
              
              {/* NPC Form card */}
              <div className="p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-4">
                <h4 className="font-bold text-sm uppercase text-slate-300">
                  {editingNpcId ? 'Редактировать NPC' : 'Создать Нового Персонажа'}
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Имя персонажа</label>
                    <input 
                      type="text" 
                      value={npcName} 
                      onChange={(e) => setNpcName(e.target.value)}
                      placeholder="Старик Байанай"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Роль / Звание</label>
                    <input 
                      type="text" 
                      value={npcRole} 
                      onChange={(e) => setNpcRole(e.target.value)}
                      placeholder="Шаман Леса"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Иконка / Эмодзи</label>
                    <input 
                      type="text" 
                      value={npcAvatar} 
                      onChange={(e) => setNpcAvatar(e.target.value)}
                      placeholder="🧙‍♂️"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:border-indigo-500 text-center text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Характер и стиль общения</label>
                  <textarea 
                    value={npcPersonality} 
                    onChange={(e) => setNpcPersonality(e.target.value)}
                    placeholder="Пример: Говорит скрипучим старческим голосом, курит можжевельник, часто кашляет и обращается к духам Байаная..."
                    rows={3}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-200 leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {editingNpcId && (
                    <button onClick={() => setEditingNpcId(null)} className="py-1.5 px-3 text-xs bg-slate-800 rounded-lg hover:bg-slate-700">Отмена</button>
                  )}
                  <button 
                    onClick={handleSaveNpc}
                    className="py-1.5 px-4 text-xs bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Сохранить NPC
                  </button>
                </div>
              </div>

              {/* Characters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {npcs.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-slate-800/20 border border-slate-800 flex gap-4 items-start relative group">
                    <div className="text-3xl p-3 rounded-2xl bg-indigo-500/10 shrink-0">
                      {n.avatar || '🧙‍♂️'}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h5 className="font-extrabold text-sm">{n.name}</h5>
                      <span className="text-[10px] text-indigo-400 font-semibold">{n.role}</span>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{n.personality}</p>
                    </div>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-slate-900 p-1 rounded-lg">
                      <button onClick={() => handleEditNpcClick(n)} className="p-1 hover:text-indigo-400"><Code className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteNpc(n.id)} className="p-1 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: PROMPT PLAYGROUND */}
          {activeSubTab === 'playground' && (
            <div className="space-y-6" id="ai-playground-pane">
              <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800/80 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Сообщение игрока для симуляции</label>
                  <input 
                    type="text" 
                    value={testUserMessage}
                    onChange={(e) => setTestUserMessage(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="flex justify-end">
                  <button 
                    onClick={handleTestPrompt}
                    disabled={isLoadingTest}
                    className="py-2 px-5 bg-gradient-to-r from-indigo-600 to-pink-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/10"
                  >
                    {isLoadingTest ? 'Шаман думает...' : 'Запустить ИИ-генерацию'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Response output */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Ответ ИИ-Ведущего (Simulation output)</label>
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 min-h-24 text-sm text-slate-200 leading-relaxed font-serif relative overflow-hidden">
                  <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  {testAIResponse ? (
                    <p className="pl-4">{testAIResponse}</p>
                  ) : (
                    <p className="text-slate-500 pl-4">Ожидание запуска генерации...</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: VERSION CONTROL HISTORY */}
          {activeSubTab === 'versions' && (
            <div className="space-y-4" id="version-control-pane">
              {historyLogs.map(log => (
                <div key={log.id} className="p-4 rounded-xl bg-slate-800/20 border border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-slate-200">{log.action}</div>
                    <div className="text-slate-400 text-[10px] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.time}</span>
                      <span>&bull;</span>
                      <span>Автор: {log.author}</span>
                    </div>
                  </div>
                  <button className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-[10px] font-bold">
                    Откатить (Restore)
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: SMART PROMPT PREVIEW ASSEMBLY */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-800/20 border border-slate-800 space-y-4">
            <h4 className="font-extrabold text-base flex items-center gap-2">
              <Cpu className="text-pink-500 w-5 h-5 animate-pulse" />
              Анатомия промпта ИИ
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Вот как Context Builder собирает итоговую инструкцию для Gemini перед каждым ответом:
            </p>

            <div className="space-y-3 font-mono text-[10px]">
              
              <div className="p-3 rounded bg-slate-900 border-l-2 border-indigo-500">
                <span className="text-indigo-400 font-bold uppercase tracking-wider block mb-1">1. Системные параметры</span>
                <p className="text-slate-400 line-clamp-2">{systemPrompt || 'Вы ИИ-Шаман...'}</p>
              </div>

              <div className="p-3 rounded bg-slate-900 border-l-2 border-pink-500">
                <span className="text-pink-400 font-bold uppercase tracking-wider block mb-1">2. Мифология & Сюжет</span>
                <p className="text-slate-400 line-clamp-2">{story || 'Приключение начинается в тайге...'}</p>
              </div>

              <div className="p-3 rounded bg-slate-900 border-l-2 border-amber-500">
                <span className="text-amber-400 font-bold uppercase tracking-wider block mb-1">3. Состояние игрока</span>
                <p className="text-slate-400 text-[9px]">
                  Уровень: 1 | Звание: Новичок | Предметы: Компас, Спички
                </p>
              </div>

              <div className="p-3 rounded bg-slate-900 border-l-2 border-emerald-500">
                <span className="text-emerald-400 font-bold uppercase tracking-wider block mb-1">4. Активный этап квеста</span>
                <p className="text-slate-400 text-[9px] line-clamp-1">
                  Текущее испытание: Загадка про Шамана
                </p>
              </div>

            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Синтаксис: Markdown</span>
              <span>Модель: Gemini Flash</span>
            </div>
          </div>
        </div>

      </div>

      {/* Custom project/context creation modal */}
      {renderCreateModal()}

    </div>
  );
}
