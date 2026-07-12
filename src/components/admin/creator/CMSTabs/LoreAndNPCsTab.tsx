import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Info, Eye, Image, Film, Table, Link } from 'lucide-react';
import { CMSProject } from '../types';
import { NPC } from '../../../../packages/types/index';

interface LoreAndNPCsTabProps {
  project: Partial<CMSProject>;
  onChange: (updated: Partial<CMSProject>) => void;
}

export default function LoreAndNPCsTab({ project, onChange }: LoreAndNPCsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'lore' | 'npcs'>('lore');
  const [npcEditorIndex, setNpcEditorIndex] = useState<number | null>(null);
  
  // Local state for editing or creating an NPC
  const [npcForm, setNpcForm] = useState<Partial<NPC & { history: string; style: string; forbidden: string }>>({});

  const npcs = project.npcs || [];

  const handleSaveNpc = () => {
    if (!npcForm.name) return;
    const cleanNpc: NPC = {
      id: npcForm.id || `npc-${Math.random().toString(36).substring(2, 7)}`,
      name: npcForm.name,
      role: npcForm.role || 'Ведущий',
      personality: npcForm.personality || 'Загадочный',
      avatar: npcForm.avatar || '🧙‍♂️',
    };

    // Embed deeper prompt modifiers inside personality safely for the game engine
    const advancedPersonality = `
Роль: ${cleanNpc.role}
Характер: ${cleanNpc.personality}
Предыстория: ${npcForm.history || ''}
Стиль речи: ${npcForm.style || ''}
Запрещенные темы: ${npcForm.forbidden || ''}
    `.trim();

    const fullNpc = {
      ...cleanNpc,
      personality: advancedPersonality
    };

    let updatedNpcs = [...npcs];
    if (npcEditorIndex !== null && npcEditorIndex >= 0) {
      updatedNpcs[npcEditorIndex] = fullNpc;
    } else {
      updatedNpcs.push(fullNpc);
    }

    onChange({ npcs: updatedNpcs });
    setNpcEditorIndex(null);
    setNpcForm({});
  };

  const handleEditNpcClick = (index: number) => {
    const target = npcs[index];
    
    // Parse out deep prompt structures if they exist
    let history = '';
    let style = '';
    let forbidden = '';
    let personality = target.personality;

    if (target.personality.includes('Роль:')) {
      const matchHistory = target.personality.match(/Предыстория:\s*([\s\S]*?)(?=\s*Стиль речи:|$)/);
      const matchStyle = target.personality.match(/Стиль речи:\s*([\s\S]*?)(?=\s*Запрещенные темы:|$)/);
      const matchForbidden = target.personality.match(/Запрещенные темы:\s*([\s\S]*?)$/);
      const matchPersonality = target.personality.match(/Характер:\s*([\s\S]*?)(?=\s*Предыстория:|$)/);

      if (matchHistory) history = matchHistory[1].trim();
      if (matchStyle) style = matchStyle[1].trim();
      if (matchForbidden) forbidden = matchForbidden[1].trim();
      if (matchPersonality) personality = matchPersonality[1].trim();
    }

    setNpcForm({
      ...target,
      personality,
      history,
      style,
      forbidden
    });
    setNpcEditorIndex(index);
  };

  const handleDeleteNpc = (index: number) => {
    if (npcs.length <= 1) {
      alert('У проекта должен быть хотя бы один ИИ-персонаж (NPC).');
      return;
    }
    if (!confirm('Удалить этого персонажа?')) return;
    const updated = npcs.filter((_, idx) => idx !== index);
    onChange({ npcs: updated });
  };

  const handleAddNpcClick = () => {
    setNpcForm({
      avatar: '🧙‍♂️',
      role: 'Проводник',
      personality: 'Дружелюбный, загадочный',
      history: '',
      style: 'Говорит таинственными загадками',
      forbidden: 'Разглашение ответов квеста'
    });
    setNpcEditorIndex(-1); // -1 signifies new
  };

  return (
    <div className="space-y-6" id="cms-lore-and-npcs">
      
      {/* SECTION SELECTOR HEADER */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => { setActiveSubTab('lore'); setNpcEditorIndex(null); }}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeSubTab === 'lore' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          📖 Книга Лора и Сюжет
        </button>
        <button
          onClick={() => setActiveSubTab('npcs')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeSubTab === 'npcs' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          🎭 Персонажи (NPC) ({npcs.length})
        </button>
      </div>

      {/* LORE MAIN WINDOW */}
      {activeSubTab === 'lore' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* LORE EDITING WORKSPACE */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-white text-md">Содержание Истории и Легенды</h3>
              <div className="flex gap-1">
                <button title="Изображение" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400" onClick={() => {
                  const val = (project.lore?.story || '') + '\n\n![Иллюстрация](https://images.unsplash.com/photo-1518156677180-95a2893f3e9f)';
                  onChange({ lore: { ...project.lore, story: val } as any });
                }}><Image className="w-3.5 h-3.5" /></button>
                <button title="Видео" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400" onClick={() => {
                  const val = (project.lore?.story || '') + '\n\n[Видео-экскурсия](https://youtube.com/watch?v=123)';
                  onChange({ lore: { ...project.lore, story: val } as any });
                }}><Film className="w-3.5 h-3.5" /></button>
                <button title="Таблица" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400" onClick={() => {
                  const val = (project.lore?.story || '') + '\n\n| Параметр | Значение |\n|---|---|\n| Артефакт | Золотое сечение |';
                  onChange({ lore: { ...project.lore, story: val } as any });
                }}><Table className="w-3.5 h-3.5" /></button>
                <button title="Ссылка" className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400" onClick={() => {
                  const val = (project.lore?.story || '') + '\n[Википедия проекта](https://wikipedia.org)';
                  onChange({ lore: { ...project.lore, story: val } as any });
                }}><Link className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase">Основной художественный сюжет (Markdown)</label>
              <textarea
                className="w-full h-80 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={project.lore?.story || ''}
                onChange={(e) => onChange({ lore: { ...project.lore, story: e.target.value } as any })}
                placeholder="# Легенда о забытой экспедиции...&#10;&#10;Используйте Markdown для форматирования заголовков, таблиц, списков и ссылок."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase">Свод Правил квеста (Markdown)</label>
              <textarea
                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                value={project.lore?.rules || ''}
                onChange={(e) => onChange({ lore: { ...project.lore, rules: e.target.value } as any })}
                placeholder="1. Запрещено заходить за ограждения.&#10;2. Ответы пишите в чат строчными буквами."
              />
            </div>
          </div>

          {/* VISUAL MARKDOWN PREVIEW */}
          <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              Предпросмотр отображения лора (Книга Сценариста)
            </h3>

            <div className="bg-slate-950 border border-slate-900 rounded-2xl p-5 h-[480px] overflow-y-auto text-slate-300 prose prose-invert text-xs space-y-4 max-w-none">
              <h2 className="text-white font-display font-bold text-lg border-b border-slate-800 pb-2">Сюжетная линия</h2>
              {project.lore?.story ? (
                <div className="whitespace-pre-wrap leading-relaxed space-y-3">
                  {/* Basic parser to make markdown look pretty visually */}
                  {project.lore.story.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) return <h1 key={idx} className="text-xl font-bold text-white mt-4">{line.replace('# ', '')}</h1>;
                    if (line.startsWith('## ')) return <h2 key={idx} className="text-lg font-semibold text-indigo-300 mt-3">{line.replace('## ', '')}</h2>;
                    if (line.startsWith('* ') || line.startsWith('- ')) return <li key={idx} className="list-disc ml-4 text-slate-300">{line.substring(2)}</li>;
                    if (line.startsWith('![')) {
                      return <div key={idx} className="my-2 p-2 bg-slate-900 border border-slate-800 text-center rounded-xl text-slate-400 text-[10px]">🖼️ Изображение / Карта местности</div>;
                    }
                    return <p key={idx} className="my-1">{line}</p>;
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic">Напишите что-нибудь слева, чтобы увидеть визуальную раскладку.</p>
              )}

              <h2 className="text-white font-display font-bold text-lg border-b border-slate-800 pb-2 mt-6">Свод Правил и Ограничений</h2>
              {project.lore?.rules ? (
                <div className="whitespace-pre-wrap text-slate-300 leading-relaxed text-xs">
                  {project.lore.rules}
                </div>
              ) : (
                <p className="text-slate-500 italic">Свод правил пуст.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NPCs LIST AND CREATOR */}
      {activeSubTab === 'npcs' && (
        <div className="space-y-6 animate-fadeIn">
          {npcEditorIndex === null ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {npcs.map((npc, idx) => (
                <div key={npc.id} className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col justify-between hover:border-slate-700 transition-all group">
                  <div className="flex gap-4">
                    <div className="text-4xl w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-lg">
                      {npc.avatar || '🧙‍♂️'}
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <h4 className="font-display font-bold text-sm text-white truncate">{npc.name}</h4>
                      <p className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full inline-block font-mono uppercase">{npc.role}</p>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mt-1">{npc.personality.replace(/Роль[\s\S]*Характер:/, '').trim()}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 border-t border-slate-800/60 pt-3 mt-4 justify-end">
                    <button
                      onClick={() => handleEditNpcClick(idx)}
                      className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:text-indigo-400 rounded-lg text-[10px] font-mono text-slate-400 flex items-center gap-1 transition-all"
                    >
                      <Edit2 className="w-3 h-3" /> Изменить
                    </button>
                    <button
                      onClick={() => handleDeleteNpc(idx)}
                      className="px-3 py-1.5 bg-slate-950 border border-red-900 hover:bg-red-950 hover:text-red-400 rounded-lg text-[10px] font-mono text-slate-500 flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3 h-3" /> Удалить
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddNpcClick}
                className="border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 transition-all bg-slate-900/10 min-h-[160px]"
              >
                <Plus className="w-6 h-6" />
                <span className="text-xs font-semibold">Добавить персонажа (NPC)</span>
              </button>
            </div>
          ) : (
            /* ACTIVE NPC EDITOR FORM */
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 max-w-2xl mx-auto animate-slideUp">
              <h3 className="font-display font-bold text-md text-white border-b border-slate-800 pb-3 flex justify-between items-center">
                <span>{npcEditorIndex === -1 ? 'Создать нового ИИ-персонажа' : 'Редактировать NPC'}</span>
                <span className="text-xs text-slate-500 font-mono">id: {npcForm.id || 'new'}</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Имя персонажа</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Хранитель Гор, Сержант Ковальски"
                    value={npcForm.name || ''}
                    onChange={(e) => setNpcForm({ ...npcForm, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Аватар (Эмодзи)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="🧙‍♂️, 🤖, 👩‍🚀"
                    value={npcForm.avatar || ''}
                    onChange={(e) => setNpcForm({ ...npcForm, avatar: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Игровое амплуа / Роль</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Проводник, Профессор, Злодей"
                    value={npcForm.role || ''}
                    onChange={(e) => setNpcForm({ ...npcForm, role: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Черты характера (Personality)</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    placeholder="Циничный, ворчливый, но добрый"
                    value={npcForm.personality || ''}
                    onChange={(e) => setNpcForm({ ...npcForm, personality: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                  История персонажа (Backstory) <Info className="w-3.5 h-3.5 text-slate-500" title="Влияет на контекст его воспоминаний в разговоре" />
                </label>
                <textarea
                  className="w-full h-24 bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Был оставлен здесь 50 лет назад. Охраняет золотые слитки в шахтах..."
                  value={npcForm.history || ''}
                  onChange={(e) => setNpcForm({ ...npcForm, history: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Манера и Стиль речи</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    placeholder="Использует старинные слова, кашляет, много ворчит"
                    value={npcForm.style || ''}
                    onChange={(e) => setNpcForm({ ...npcForm, style: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400 uppercase">Запрещённые темы / Табу</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    placeholder="Запрещено говорить прямое слово-ответ: 'север'"
                    value={npcForm.forbidden || ''}
                    onChange={(e) => setNpcForm({ ...npcForm, forbidden: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-800">
                <button
                  onClick={() => { setNpcEditorIndex(null); setNpcForm({}); }}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 text-xs font-semibold rounded-xl"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveNpc}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Сохранить персонажа
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
