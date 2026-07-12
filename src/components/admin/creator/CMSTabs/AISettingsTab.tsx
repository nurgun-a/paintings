import React, { useState, useEffect } from 'react';
import { Cpu, RotateCcw, AlertTriangle, Sparkles, Check, FileCode, SplitSquareVertical } from 'lucide-react';
import { CMSProject, SystemPromptVersion } from '../types';

interface AISettingsTabProps {
  project: Partial<CMSProject>;
  onChange: (updated: Partial<CMSProject>) => void;
}

export default function AISettingsTab({ project, onChange }: AISettingsTabProps) {
  const [activeModel, setActiveModel] = useState('deepseek-v3');
  const [temperature, setTemperature] = useState(0.5);
  const [contextLimit, setContextLimit] = useState(8000);
  const [maxTokens, setMaxTokens] = useState(1500);

  // Prompt autosave state
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedHistoryVerId, setSelectedHistoryVerId] = useState<string>('');

  const lore = project.lore || { systemPrompt: '', story: '', rules: '' };

  // Generate some realistic historic system prompt versions for comparison
  const promptVersions: SystemPromptVersion[] = project.systemPromptVersions || [
    {
      id: 'v-1',
      version: 'Версия 1.0.0 (Стабильная)',
      content: 'Вы — ИИ-Ведущий квеста. Отвечайте коротко и загадочно. Поддерживайте легенду про скрытое хранилище.',
      timestamp: '2026-07-09 14:22',
      author: 'Сценарист Влад'
    },
    {
      id: 'v-2',
      version: 'Версия 1.1.0 (Бета)',
      content: 'Вы — ИИ-Ведущий квеста. Говорите загадками. Не разглашайте ответы раньше времени! Подсказывайте про древние руины.',
      timestamp: '2026-07-10 09:15',
      author: 'Сценарист Влад'
    }
  ];

  // Auto-set the first historical version for comparison if empty
  useEffect(() => {
    if (promptVersions.length > 0 && !selectedHistoryVerId) {
      setSelectedHistoryVerId(promptVersions[0].id);
    }
  }, [promptVersions]);

  const handlePromptChange = (val: string) => {
    setAutosaveStatus('saving');
    onChange({ lore: { ...lore, systemPrompt: val } as any });
    
    // Simulate real visual autosave timeout
    const t = setTimeout(() => {
      setAutosaveStatus('saved');
    }, 800);
    return () => clearTimeout(t);
  };

  const handleRollback = () => {
    const historical = promptVersions.find(v => v.id === selectedHistoryVerId);
    if (!historical) return;
    if (confirm(`Вы действительно хотите откатить Системный Промпт к "${historical.version}"?`)) {
      handlePromptChange(historical.content);
    }
  };

  const selectedHistorical = promptVersions.find(v => v.id === selectedHistoryVerId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cms-ai-intelligence-settings">
      
      {/* LEFT COLUMN: MODEL METADATA CONTROL PANEL */}
      <div className="space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-5">
          <h3 className="font-display font-bold text-white text-md flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" /> Конфигурация Ведущего ИИ
          </h3>

          <div className="space-y-2 text-xs">
            <label className="text-[10px] font-mono text-slate-400 uppercase">Основная LLM модель</label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-white"
            >
              <option value="deepseek-v3">DeepSeek-V3 (Основной ИИ-Ведущий)</option>
              <option value="deepseek-r1">DeepSeek-R1 (Рассуждающий ИИ)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Скоростной)</option>
              <option value="gpt-4o-mini">GPT-4o Mini (Резервный)</option>
            </select>
            <p className="text-[10px] text-slate-500 italic">Смена модели происходит прозрачно на сервере без перезапуска квеста.</p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Температура (Креативность)</label>
              <span className="font-mono text-indigo-400 font-bold">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.2"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Холодный (0.1)</span>
              <span>Баланс (0.5)</span>
              <span>Свободный (1.2)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Лимит контекста</label>
              <input
                type="number"
                value={contextLimit}
                onChange={(e) => setContextLimit(parseInt(e.target.value) || 4000)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-400 uppercase">Макс. токенов вывода</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 1000)}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECURITY & GUARDRAILS INFO */}
        <div className="bg-amber-950/20 border border-amber-900/40 p-5 rounded-3xl space-y-2.5">
          <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-display">
            <AlertTriangle className="w-4 h-4" /> Защитный контур ИИ
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Промпты автоматически фильтруются на сервере. Для предотвращения джейлбрейков (Jailbreak) и разглашения ответов квеста, в Системный Промпт встраивается изолированная песочница.
          </p>
        </div>
      </div>

      {/* RIGHT/CENTER: ADVANCED PROMPT WRITING ZONE (col-span-2) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Prompt workspace */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <h3 className="font-display font-bold text-white text-md flex items-center gap-2">
                <FileCode className="w-4.5 h-4.5 text-indigo-400" /> Системный Промпт Ведущего
              </h3>
              <p className="text-[10px] text-slate-500">Задайте глобальные инструкции и поведение для ИИ-модели</p>
            </div>

            {/* Autosave badge */}
            <div className="text-xs font-mono">
              {autosaveStatus === 'saving' && <span className="text-amber-400 animate-pulse">● Сохранение...</span>}
              {autosaveStatus === 'saved' && <span className="text-emerald-400 flex items-center gap-1">✓ Автосохранение успешно</span>}
              {autosaveStatus === 'idle' && <span className="text-slate-500">Система готова</span>}
            </div>
          </div>

          <textarea
            value={lore.systemPrompt}
            onChange={(e) => handlePromptChange(e.target.value)}
            className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
            placeholder="Вы — ИИ-Ведущий древней пирамиды...&#10;Описывайте шаги, давайте подсказки, но никогда не называйте пароль напрямую!"
          />
        </div>

        {/* PROMPT HISTORIC COMPARISON DRAWER (DIFFS!) */}
        <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <h4 className="font-display font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <SplitSquareVertical className="w-4 h-4 text-indigo-400" /> Сравнение версий Системного промпта
            </h4>
            
            <div className="flex gap-2">
              <select
                value={selectedHistoryVerId}
                onChange={(e) => setSelectedHistoryVerId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg py-1 px-3 text-xs text-slate-200 focus:outline-none"
              >
                {promptVersions.map((v) => (
                  <option key={v.id} value={v.id}>{v.version} ({v.timestamp})</option>
                ))}
              </select>
              
              <button
                onClick={handleRollback}
                className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/40 hover:text-white rounded-lg text-xs text-indigo-400 font-semibold transition-all"
              >
                Откатить к этой версии
              </button>
            </div>
          </div>

          {/* VISUAL DIFF PANEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 bg-slate-950 border border-slate-900 p-4 rounded-xl">
              <span className="text-[9px] font-mono text-slate-500 uppercase block border-b border-slate-900 pb-1.5 mb-2">Историческая версия ({selectedHistorical?.author})</span>
              <p className="text-[11px] font-mono text-slate-400 whitespace-pre-wrap leading-relaxed h-32 overflow-y-auto">
                {selectedHistorical?.content || 'Нет данных для сравнения'}
              </p>
            </div>
            
            <div className="space-y-1 bg-slate-950 border border-slate-900 p-4 rounded-xl">
              <span className="text-[9px] font-mono text-indigo-500 uppercase block border-b border-slate-900 pb-1.5 mb-2">Текущий черновик в редакторе (Автосохранен)</span>
              <p className="text-[11px] font-mono text-white whitespace-pre-wrap leading-relaxed h-32 overflow-y-auto">
                {lore.systemPrompt || 'Черновик пуст.'}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
