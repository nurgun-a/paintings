import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  HelpCircle, 
  Play, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Award, 
  MapPin, 
  QrCode, 
  Camera, 
  ArrowRight, 
  RotateCcw, 
  FileCheck, 
  Activity, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuestProject, QuestStep, NPC } from '../../packages/types/index.js';
import { DesignerQuestion, SimulationResult, AIReviewReport, ValidationIssue } from '../../packages/ai-quest-designer/index.js';

interface AIQuestDesignerTabProps {
  onSaveAsDraft: (project: QuestProject) => void;
  setTab: (tab: string) => void;
}

export default function AIQuestDesignerTab({ onSaveAsDraft, setTab }: AIQuestDesignerTabProps) {
  // Navigation & step control
  const [designerStep, setDesignerStep] = useState<'prompt' | 'questions' | 'generating' | 'review'>('prompt');
  
  // Input fields
  const [ideaPrompt, setIdeaPrompt] = useState('');
  const [questions, setQuestions] = useState<DesignerQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Generating state
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [loadingText, setLoadingText] = useState('Анализ параметров...');

  // Result state
  const [generatedProject, setGeneratedProject] = useState<QuestProject | null>(null);
  
  // Human-in-the-loop refinement
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  // Simulation & Audit lab
  const [simulationActive, setSimulationActive] = useState(false);
  const [selectedSimPersona, setSelectedSimPersona] = useState<'Beginner' | 'Normal' | 'Expert'>('Normal');
  const [simResults, setSimResults] = useState<SimulationResult[]>([]);
  const [reviewReport, setReviewReport] = useState<AIReviewReport | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isSimulatingAll, setIsSimulatingAll] = useState(false);

  // Trigger Questions Generation
  const handleStartPlanning = async () => {
    if (!ideaPrompt.trim()) return;
    setDesignerStep('questions');
    setLoadingText('Формирование уточняющих вопросов...');
    
    try {
      const res = await fetch('/api/designer/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaPrompt })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          // Initialize empty answers
          const initialAnswers: Record<string, string> = {};
          data.questions.forEach((q: any) => {
            initialAnswers[q.id] = answers[q.id] || '';
          });
          setAnswers(initialAnswers);
          return;
        }
      }
      throw new Error('Некорректный ответ сервера');
    } catch (err) {
      console.error('Failed to get questions from server, using high-quality local fallback planner:', err);
      const fallbackQs = [
        {
          id: 'culture_focus',
          field: 'culture_focus',
          questionText: 'Какую культуру или регион России вы хотите взять за основу квеста?',
          placeholder: 'Например: Саамы Кольского полуострова, Нарты Кавказа, Татары Поволжья или Славянский фольклор',
          options: [
            'Алтайские шаманы и таежные духи',
            'Легенды кавказских нартов (Кавказ)',
            'Карельские руны (Калевала)',
            'Культура саамов (Кольский полуостров)',
            'Мифология Поволжья (Татарстан/Башкортостан)',
            'Древнерусские предания (Великий Новгород)'
          ]
        },
        {
          id: 'location',
          field: 'location',
          questionText: 'Где территориально будет проходить квест?',
          placeholder: 'улицы Иркутска, священное озеро, горный перевал или онлайн',
          options: ['Горные тропы и башни', 'Таежная глушь и реки', 'Древние городища / кремль', 'Онлайн-симуляция приключения']
        },
        {
          id: 'npc_type',
          field: 'npc_type',
          questionText: 'Каким будет ваш ИИ-Проводник?',
          placeholder: 'Старейшина, говорящий легендами, или дух-хранитель',
          options: ['Мудрый таежный старейшина', 'Кавказский старец-нартовед', 'Бортовой ИИ экспедиции', 'Таинственная хранительница озера']
        },
        {
          id: 'mechanic',
          field: 'mechanic',
          questionText: 'Какие игровые механики вы предпочитаете?',
          options: ['Шифры и текстовые загадки', 'GPS ориентирование по координатам', 'Фотоохота на культурные символы', 'Смешанный тип испытаний']
        }
      ];
      setQuestions(fallbackQs as any);
      const initialAnswers: Record<string, string> = {};
      fallbackQs.forEach((q: any) => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);
    }
  };

  // Trigger Multi-Agent Core Generation
  const handleGenerateQuest = async () => {
    setDesignerStep('generating');
    
    // Simulate active agent visual pipeline logging
    const steps = ['Story Agent', 'Game Designer Agent', 'Puzzle Agent', 'Balance Agent', 'QA Agent'];
    setAgentLogs(steps.map(s => ({ agent: s, status: 'idle', message: 'Ожидание...' })));

    let logsRef = steps.map(s => ({ agent: s, status: 'idle', message: 'Ожидание...' }));
    
    const setLog = (agent: string, status: 'idle' | 'working' | 'done', message: string) => {
      logsRef = logsRef.map(l => l.agent === agent ? { agent, status, message } : l);
      setAgentLogs(logsRef);
    };

    // Sequential fake ticks for visual feedback, then resolve actual API
    for (let i = 0; i < steps.length; i++) {
      const agent = steps[i];
      setLog(agent, 'working', 'Сборка контекста...');
      await new Promise(r => setTimeout(r, 600));
      setLog(agent, 'done', 'Завершено.');
    }

    try {
      const res = await fetch('/api/designer/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: ideaPrompt, answers })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedProject(data.project);
        setDesignerStep('review');
        // Trigger automated simulation and review instantly on load
        triggerSimulationAndReview(data.project);
      } else {
        throw new Error('Ошибка генерации на сервере');
      }
    } catch (err) {
      console.error('Using rich local generator fallback:', err);
      const culture = answers.culture_focus || 'Алтайские шаманы и таежные духи';
      const loc = answers.location || 'Таежная глушь';
      const npc = answers.npc_type || 'Мудрый старейшина';
      
      const generated: QuestProject = {
        id: `quest-${Math.random().toString(36).substring(2, 8)}`,
        name: `Наследие России: ${culture}`,
        description: `Мистический квест на локации "${loc}" под руководством проводника: ${npc}.`,
        status: 'draft',
        lore: {
          systemPrompt: `Вы — ${npc}, хранитель традиций культуры "${culture}". Говорите мудро, используйте фольклор, загадки и мистические образы этой культуры.`,
          story: `Вы прибыли в древний регион "${loc}". Здесь, среди вековых памятников, вас встречает ${npc}, готовый открыть тропу познания, если вы выдержите испытания духов.`,
          rules: 'Соблюдайте традиции предков. Проходите шаги верификации, чтобы получать XP и реликвии.'
        },
        npcs: [
          {
            id: 'guide-custom',
            name: npc,
            role: 'Проводник культуры',
            personality: `Мудрый представитель традиции "${culture}"`,
            avatar: '🧙‍♂️'
          }
        ],
        steps: [
          {
            id: 'step-1-riddle',
            title: `Испытание мудрости: ${culture}`,
            description: `Слушайте первую загадку хранителя: "Две сестры друг за другом бегут, одна другую никак не догонит. Что это в преданиях предков?"`,
            type: 'TEXT',
            verificationData: {
              answers: ['солнце и луна', 'день и ночь', 'небо и земля']
            },
            reward: {
              xp: 250,
              item: 'Оберег искателя'
            }
          },
          {
            id: 'step-2-gps',
            title: 'Место Силы',
            description: `Отправляйтесь в священную точку на карте местности "${loc}" для соприкосновения с традициями предков.`,
            type: 'LOCATION',
            verificationData: {
              coords: { lat: 55.7558, lng: 37.6173, radius: 40 }
            },
            reward: {
              xp: 350,
              item: 'Деревянный тотем'
            }
          },
          {
            id: 'step-3-photo',
            title: 'Священный символ',
            description: 'Найдите и сфотографируйте природный символ или деревянную резьбу на местности, чтобы доказать уважение к традициям.',
            type: 'PHOTO',
            verificationData: {
              referenceImage: 'Деревянное изделие, резьба, орнамент или священное дерево'
            },
            reward: {
              xp: 300,
              achievement: 'Почтение Традиций'
            }
          }
        ]
      };
      setGeneratedProject(generated);
      setDesignerStep('review');
      triggerSimulationAndReview(generated);
    }
  };

  // Human Feedback Refinement Loop
  const handleImproveProject = async () => {
    if (!feedbackInput.trim() || !generatedProject) return;
    setIsImproving(true);
    try {
      const res = await fetch('/api/designer/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: generatedProject, feedback: feedbackInput })
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedProject(data.project);
        setFeedbackInput('');
        // Rerun simulation for updated project
        triggerSimulationAndReview(data.project);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsImproving(false);
    }
  };

  // Trigger Playthrough and review
  const triggerSimulationAndReview = async (project: QuestProject) => {
    setIsSimulatingAll(true);
    try {
      const res = await fetch('/api/designer/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });
      if (res.ok) {
        const data = await res.json();
        setSimResults(data.simResults);
        setReviewReport(data.reviewReport);
        setValidationIssues(data.validationResult.issues);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulatingAll(false);
    }
  };

  // Save as draft inside CMS repository
  const handleExportToCMS = async () => {
    if (!generatedProject) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(generatedProject)
      });
      if (res.ok) {
        const savedProject = await res.json();
        onSaveAsDraft(savedProject);
        // Switch to quest-creator tab
        setTab('quest-creator');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStepIcon = (type: string) => {
    switch (type) {
      case 'LOCATION': return <MapPin className="w-4 h-4 text-emerald-400" />;
      case 'QR': return <QrCode className="w-4 h-4 text-indigo-400" />;
      case 'PHOTO': return <Camera className="w-4 h-4 text-pink-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6" id="ai-designer-workspace">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h1 className="text-2xl font-black tracking-tight text-white">AI Quest Designer</h1>
          </div>
          <p className="text-xs text-slate-400">Мультиагентная среда разработки игровых сценариев и автоматизированного тестирования.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl font-mono text-[10px] text-slate-400">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>5 ИИ-Агентов в связке</span>
        </div>
      </div>

      {/* DESIGNER WORKSPACE GRID */}
      <div className="min-h-[580px] bg-slate-900/40 border border-slate-850 rounded-3xl p-6 relative overflow-hidden">
        
        {/* BACKGROUND AMBIENT GLOW */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

        <AnimatePresence mode="wait">
          
          {/* STEP 1: INITIAL PROMPT FIELD */}
          {designerStep === 'prompt' && (
            <motion.div
              key="step-prompt"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto py-12 space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-white font-display">Опишите вашу идею квеста</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  ИИ-Ассистент поможет проработать полноценный сюжет, лор, персонажей, шаги верификации, награды и сбалансирует квест.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
                <textarea
                  value={ideaPrompt}
                  onChange={(e) => setIdeaPrompt(e.target.value)}
                  placeholder="Например: Мистический квест на 1.5 часа по берегу Ангары под Иркутском. Игрок ищет сокровища белого офицера, общаясь с ворчливым духом егеря Саввы. Задания должны содержать фотографирование природы и поиск старых GPS координат..."
                  className="w-full h-36 bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 resize-none leading-relaxed"
                />

                <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                  <span className="text-[10px] font-mono text-slate-500">Минимум 15 символов</span>
                  <button
                    onClick={handleStartPlanning}
                    disabled={ideaPrompt.trim().length < 10}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    Продолжить <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TEMPLATE SUGGESTIONS */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block text-center">Или выберите быстрый пресет идеи народов России:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Шаманские обряды Сибири: Поиск священного Сэргэ и древних духов тайги на Алтае.',
                    'Кавказские баллады: В поисках утерянных сокровищ нартов в горных башнях Ингушетии.',
                    'Загадки Русского Севера: Тайны священных сейдов саамов на Кольском полуострове.',
                    'Легенды Великого Новгорода: Исторический квест по берегам Волхова с ИИ-гусляром Садко.',
                    'Предания Татарстана: Легенды казанских ханов и загадки острова Свияжск.'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => setIdeaPrompt(preset)}
                      className="p-3 text-left bg-slate-900/60 border border-slate-850 hover:border-indigo-500/50 rounded-xl text-xs text-slate-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CLARIFYING QUESTIONS FORM */}
          {designerStep === 'questions' && (
            <motion.div
              key="step-questions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Этап планирования</span>
                <h2 className="text-lg font-bold text-white font-display">Уточнение параметров квеста</h2>
                <p className="text-xs text-slate-400">ИИ составил несколько вопросов, чтобы сгенерировать точные загадки и сбалансировать награды.</p>
              </div>

              {questions.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                  <p className="text-xs text-slate-400 font-mono">Генерация персонализированных вопросов от Planner-агента...</p>
                </div>
              ) : (
                <div className="space-y-5 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  {questions.map((q) => (
                    <div key={q.id} className="space-y-2">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                        {q.questionText}
                      </label>
                      
                      {q.options ? (
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                              className={`p-2.5 text-left text-xs rounded-xl border transition-all ${
                                answers[q.id] === opt 
                                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 font-semibold' 
                                  : 'bg-slate-950 border-slate-850 hover:border-slate-800 text-slate-400'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="text"
                          placeholder={q.placeholder}
                          value={answers[q.id] || ''}
                          onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      )}
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4 border-t border-slate-850">
                    <button
                      onClick={() => setDesignerStep('prompt')}
                      className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 flex items-center gap-1 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Назад
                    </button>
                    <button
                      onClick={handleGenerateQuest}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all shadow-lg shadow-indigo-600/15"
                    >
                      🚀 Запустить генерацию Мультиагентом
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: LOGS PIPELINE WHILE GENERATING */}
          {designerStep === 'generating' && (
            <motion.div
              key="step-generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto py-12 space-y-6"
            >
              <div className="text-center space-y-2 mb-4">
                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mx-auto mb-2" />
                <h3 className="font-display font-bold text-lg text-white">Оркестрация Агентов</h3>
                <p className="text-xs text-slate-400">5 специализированных ИИ-агентов совместно проектируют квест...</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 font-mono text-xs">
                {agentLogs.map((log) => (
                  <div key={log.agent} className="flex justify-between items-center p-2.5 bg-slate-950 rounded-xl border border-slate-850/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-indigo-400">{log.agent}</span>
                      <span className="text-[10px] text-slate-500">— {log.message}</span>
                    </div>
                    {log.status === 'working' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-amber-500/15 text-amber-400 animate-pulse">Думает...</span>
                    ) : log.status === 'done' ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-emerald-500/15 text-emerald-400">Готов</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-850 text-slate-600">Ожидание</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: REVIEW & LAB WORKSPACE */}
          {designerStep === 'review' && generatedProject && (
            <motion.div
              key="step-review"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* LEFT COLUMN: VISUAL PREVIEW OF THE GENERATED QUEST (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-6">
                
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Черновик проекта</span>
                    <h3 className="font-display font-black text-xl text-white">{generatedProject.name}</h3>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[10px] font-bold uppercase font-mono">
                    Draft
                  </span>
                </div>

                {/* OVERALL PROJECT CARD */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-indigo-400 uppercase tracking-wider">История и завязка</label>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3.5 rounded-2xl border border-slate-850">
                      {generatedProject.lore.story}
                    </p>
                  </div>

                  {/* NPC PROFILE */}
                  {generatedProject.npcs && generatedProject.npcs.length > 0 && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex gap-3 items-center">
                      <span className="text-3xl p-1 bg-slate-900 border border-slate-800 rounded-xl">{generatedProject.npcs[0].avatar}</span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white block">{generatedProject.npcs[0].name}</span>
                        <span className="text-[10px] text-indigo-400 font-medium">{generatedProject.npcs[0].role} — {generatedProject.npcs[0].personality}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* QUEST STEPS LIST */}
                <div className="space-y-3">
                  <h4 className="font-display font-bold text-sm text-slate-300">Структура испытаний ({generatedProject.steps?.length || 0} этапов)</h4>
                  <div className="space-y-3">
                    {generatedProject.steps?.map((step, idx) => (
                      <div key={step.id} className="bg-slate-900/60 border border-slate-850 p-4 rounded-2xl space-y-2.5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center text-[10px] font-bold font-mono">
                              {idx + 1}
                            </span>
                            <h5 className="font-bold text-xs text-white">{step.title}</h5>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-850 text-slate-400 rounded-lg text-[9px] font-mono flex items-center gap-1">
                            {getStepIcon(step.type)} {step.type}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>

                        {/* Verification specifications preview */}
                        <div className="bg-slate-950/80 p-3 rounded-xl font-mono text-[10px] border border-slate-850/50 space-y-1 text-slate-400">
                          {step.type === 'TEXT' && (
                            <div>
                              <span className="text-indigo-400 font-bold">Ожидаемые ответы:</span>{' '}
                              {step.verificationData.answers?.map(a => `"${a}"`).join(', ')}
                            </div>
                          )}
                          {step.type === 'QR' && (
                            <div>
                              <span className="text-indigo-400 font-bold">Код QR-метки:</span> "{step.verificationData.qrCode}"
                            </div>
                          )}
                          {step.type === 'PHOTO' && (
                            <div>
                              <span className="text-indigo-400 font-bold">Vision AI маркер:</span> "{step.verificationData.referenceImage}"
                            </div>
                          )}
                          {step.type === 'LOCATION' && step.verificationData.coords && (
                            <div>
                              <span className="text-indigo-400 font-bold">GPS:</span> {step.verificationData.coords.lat.toFixed(4)}, {step.verificationData.coords.lng.toFixed(4)} (радиус {step.verificationData.coords.radius}м)
                            </div>
                          )}
                          <div>
                            <span className="text-amber-400 font-bold">Награда:</span> +{step.reward.xp} XP
                            {step.reward.item && ` • Предмет: [${step.reward.item}]`}
                            {step.reward.achievement && ` • Достижение: [${step.reward.achievement}]`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HUMAN-IN-THE-LOOP FEEDBACK REFINEMENT FORM */}
                <div className="bg-slate-900 border border-slate-850 p-5 rounded-3xl space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-xs text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
                      Корректировка сценария ИИ
                    </h4>
                    <p className="text-[10px] text-slate-400">Попросите ИИ изменить сюжетные повороты, переписать загадки или сменить механику шагов.</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackInput}
                      onChange={(e) => setFeedbackInput(e.target.value)}
                      placeholder="Например: 'Замени 2 шаг с GPS на поиск QR-кода' или 'Сделай загадки сложнее'..."
                      className="flex-1 bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={handleImproveProject}
                      disabled={isImproving || !feedbackInput.trim()}
                      className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shrink-0"
                    >
                      {isImproving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Поправить
                    </button>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: SIMULATION LAB & AI AUDIT REPORT (lg:col-span-6) */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* 1. COMPREHENSIVE EXPERT AUDIT METRICS CARD */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck className="w-4.5 h-4.5 text-indigo-400" />
                      Экспертный аудит ИИ
                    </h4>
                    
                    {isSimulatingAll && (
                      <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Запуск симуляций...
                      </span>
                    )}
                  </div>

                  {reviewReport ? (
                    <div className="space-y-5">
                      
                      {/* SCORE GAUGE */}
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono text-slate-500 uppercase">Оценка готовности</span>
                          <span className="text-2xl font-black text-white font-display block">{reviewReport.overallScore}/100</span>
                          <span className="text-[10px] text-slate-400">Проект готов к публикации на {reviewReport.overallScore}%</span>
                        </div>
                        
                        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                          {/* Circle track */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="#1e293b" strokeWidth="6" />
                            <circle 
                              cx="32" 
                              cy="32" 
                              r="28" 
                              fill="none" 
                              stroke={reviewReport.overallScore >= 80 ? '#10b981' : '#f59e0b'} 
                              strokeWidth="6" 
                              strokeDasharray={2 * Math.PI * 28}
                              strokeDashoffset={2 * Math.PI * 28 * (1 - reviewReport.overallScore / 100)}
                            />
                          </svg>
                          <span className="absolute text-[10px] font-mono font-bold text-white">{reviewReport.overallScore}%</span>
                        </div>
                      </div>

                      {/* STRENGTHS & VULNERABILITIES */}
                      <div className="space-y-3 font-sans text-xs">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Сильные стороны:</span>
                          <ul className="space-y-1.5 text-slate-300">
                            {reviewReport.strengths.slice(0, 3).map((st, i) => (
                              <li key={i} className="flex gap-2 items-start leading-relaxed">
                                <span className="text-emerald-500 shrink-0">✓</span>
                                <span>{st}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {reviewReport.vulnerabilities.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">Уязвимости (Bottlenecks):</span>
                            <ul className="space-y-1.5 text-slate-300">
                              {reviewReport.vulnerabilities.slice(0, 3).map((v, i) => (
                                <li key={i} className="flex gap-2 items-start leading-relaxed">
                                  <span className="text-amber-500 shrink-0">⚠</span>
                                  <span>{v}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {reviewReport.risks.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider block">Полевые риски:</span>
                            <ul className="space-y-1.5 text-slate-300">
                              {reviewReport.risks.slice(0, 3).map((r, i) => (
                                <li key={i} className="flex gap-2 items-start leading-relaxed text-slate-400">
                                  <span className="text-rose-500 shrink-0">⚡</span>
                                  <span>{r}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {reviewReport.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">Рекомендации методистов:</span>
                            <ul className="space-y-1.5 text-slate-300">
                              {reviewReport.recommendations.slice(0, 3).map((rec, i) => (
                                <li key={i} className="flex gap-2 items-start leading-relaxed">
                                  <span className="text-indigo-400 shrink-0">→</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs font-mono">
                      <RefreshCw className="w-8 h-8 text-indigo-500/20 animate-spin mx-auto mb-2" />
                      Генерация экспертной оценки ИИ...
                    </div>
                  )}
                </div>

                {/* 2. AUTOMATED PLAYTHROUGH SIMULATION LAB */}
                <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-black text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-4.5 h-4.5 text-amber-400" />
                      Лаборатория симуляций
                    </h4>
                    
                    <div className="flex gap-1">
                      {['Beginner', 'Normal', 'Expert'].map((pers) => (
                        <button
                          key={pers}
                          onClick={() => setSelectedSimPersona(pers as any)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${
                            selectedSimPersona === pers 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                              : 'bg-slate-950 text-slate-500 hover:text-slate-400'
                          }`}
                        >
                          {pers}
                        </button>
                      ))}
                    </div>
                  </div>

                  {simResults.length > 0 ? (
                    (() => {
                      const selectedResult = simResults.find(r => r.persona === selectedSimPersona);
                      if (!selectedResult) return null;

                      return (
                        <div className="space-y-4">
                          {/* METRIC SUMMARIES */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-2xl border border-slate-850 font-mono text-[10px]">
                            <div>
                              <span className="text-slate-500 block uppercase">Статус</span>
                              <span className={selectedResult.success ? 'text-emerald-400 font-bold' : 'text-rose-500 font-bold'}>
                                {selectedResult.success ? '✓ УСПЕХ' : '✗ ТУПИК'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase">Пройдено шагов</span>
                              <span className="text-white font-bold">{selectedResult.stepsCompleted}/{selectedResult.totalSteps}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block uppercase">Время игры</span>
                              <span className="text-white font-bold">{selectedResult.durationMinutes} мин</span>
                            </div>
                          </div>

                          {/* SIMULATION STEP-BY-STEP CHAT HISTORIES */}
                          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 h-60 overflow-y-auto space-y-3 font-mono text-[10px] text-slate-300 select-none">
                            {selectedResult.logs.map((log, lIdx) => (
                              <div key={lIdx} className="space-y-1">
                                <div className="flex justify-between text-slate-500 text-[8px] border-b border-slate-900 pb-0.5">
                                  <span>{log.sender.toUpperCase()} ({log.timestamp})</span>
                                  {log.success !== undefined && (
                                    <span className={log.success ? 'text-emerald-500' : 'text-rose-500'}>
                                      {log.success ? 'SUCCESS' : 'FAILED'}
                                    </span>
                                  )}
                                </div>
                                <p className={`leading-relaxed whitespace-pre-wrap ${
                                  log.sender === 'gamemaster' ? 'text-indigo-400' : 
                                  log.sender === 'player' ? 'text-emerald-400' : 'text-slate-400'
                                }`}>
                                  {log.text}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="py-12 text-center text-slate-500 text-xs font-mono">
                      <RefreshCw className="w-8 h-8 text-indigo-500/20 animate-spin mx-auto mb-2" />
                      Запуск игровых ботов...
                    </div>
                  )}
                </div>

                {/* 3. EXPORT / SAVE TO CMS PRIMARY CALLOUT */}
                <div className="bg-gradient-to-r from-indigo-950 to-slate-900 border border-indigo-500/20 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="font-display font-bold text-sm text-white">Все готово к визуальному наполнению!</h4>
                    <p className="text-xs text-slate-400 max-w-sm">Сохраните проект как черновик в базу данных. После этого вы сможете редактировать шаги на визуальной доске No-Code.</p>
                  </div>

                  <button
                    onClick={handleExportToCMS}
                    className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-600/15 shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <FileCheck className="w-4.5 h-4.5" /> Экспортировать в CMS
                  </button>
                </div>

              </div>

            </motion.div>
          )}

        </AnimatePresence>

      </div>

    </div>
  );
}
