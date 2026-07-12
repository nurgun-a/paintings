import React, { useState } from 'react';
import { Plus, Trash2, Award, Briefcase, Sliders, ShieldCheck } from 'lucide-react';
import { CMSProject, CMSItem, CMSAchievement, CMSLevel } from '../types';

interface ItemsAndLevelsTabProps {
  project: Partial<CMSProject>;
  onChange: (updated: Partial<CMSProject>) => void;
}

export default function ItemsAndLevelsTab({ project, onChange }: ItemsAndLevelsTabProps) {
  const [activeSection, setActiveSection] = useState<'items' | 'achievements' | 'levels'>('items');

  // Local helper states for creators
  const [itemForm, setItemForm] = useState<Partial<CMSItem>>({ rarity: 'common', type: 'quest', icon: '🔑' });
  const [achForm, setAchForm] = useState<Partial<CMSAchievement>>({ icon: '🏆', xpReward: 100 });
  const [lvlForm, setLvlForm] = useState<Partial<CMSLevel>>({ icon: '🎖️', xpRequired: 1000 });

  const items = project.items || [];
  const achievements = project.achievements || [];
  const levels = project.levels || [
    { level: 1, xpRequired: 0, title: 'Новичок', icon: '🌱' },
    { level: 2, xpRequired: 500, title: 'Ученик', icon: '📖' },
    { level: 3, xpRequired: 1200, title: 'Искатель', icon: '🔍' },
    { level: 4, xpRequired: 2500, title: 'Мастер загадок', icon: '🧙‍♂️' }
  ];

  // Actions
  const handleAddItem = () => {
    if (!itemForm.name) return;
    const newItem: CMSItem = {
      id: itemForm.id || `item-${Math.random().toString(36).substring(2, 7)}`,
      name: itemForm.name,
      description: itemForm.description || '',
      icon: itemForm.icon || '🔑',
      type: itemForm.type || 'quest',
      rarity: itemForm.rarity || 'common'
    };
    onChange({ items: [...items, newItem] });
    setItemForm({ rarity: 'common', type: 'quest', icon: '🔑' });
  };

  const handleDeleteItem = (id: string) => {
    onChange({ items: items.filter(i => i.id !== id) });
  };

  const handleAddAchievement = () => {
    if (!achForm.name) return;
    const newAch: CMSAchievement = {
      id: achForm.id || `ach-${Math.random().toString(36).substring(2, 7)}`,
      name: achForm.name,
      description: achForm.description || '',
      icon: achForm.icon || '🏆',
      xpReward: achForm.xpReward || 100,
      conditions: achForm.conditions || 'Завершение этапа'
    };
    onChange({ achievements: [...achievements, newAch] });
    setAchForm({ icon: '🏆', xpReward: 100 });
  };

  const handleDeleteAchievement = (id: string) => {
    onChange({ achievements: achievements.filter(a => a.id !== id) });
  };

  const handleAddLevel = () => {
    if (!lvlForm.level || !lvlForm.title) return;
    const newLvl: CMSLevel = {
      level: Number(lvlForm.level),
      xpRequired: Number(lvlForm.xpRequired) || 1000,
      title: lvlForm.title,
      icon: lvlForm.icon || '🎖️'
    };
    // Sort levels on insert
    const updated = [...levels.filter(l => l.level !== newLvl.level), newLvl].sort((a, b) => a.level - b.level);
    onChange({ levels: updated });
    setLvlForm({ icon: '🎖️', xpRequired: 1000 });
  };

  const handleDeleteLevel = (lvlNum: number) => {
    if (lvlNum === 1) {
      alert('Уровень 1 является начальным и не может быть удален.');
      return;
    }
    onChange({ levels: levels.filter(l => l.level !== lvlNum) });
  };

  return (
    <div className="space-y-6" id="cms-items-and-levels">
      
      {/* SECTION SELECTOR HEADER */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveSection('items')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeSection === 'items' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          🎒 Дизайнер Предметов ({items.length})
        </button>
        <button
          onClick={() => setActiveSection('achievements')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeSection === 'achievements' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          🏆 Настройка Достижений ({achievements.length})
        </button>
        <button
          onClick={() => setActiveSection('levels')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${activeSection === 'levels' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          🎖️ Кривая Уровней и XP ({levels.length})
        </button>
      </div>

      {/* ITEMS INVENTORY DESIGNER */}
      {activeSection === 'items' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Item Creation Form */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" /> Создать предмет
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Название</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-white"
                    placeholder="Бронзовый амулет"
                    value={itemForm.name || ''}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Эмодзи</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-center text-white"
                    placeholder="🧿"
                    value={itemForm.icon || ''}
                    onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Описание</label>
                <textarea
                  className="w-full h-16 bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white resize-none"
                  placeholder="Старый амулет, найденный в склепе..."
                  value={itemForm.description || ''}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Тип</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-300"
                    value={itemForm.type}
                    onChange={(e) => setItemForm({ ...itemForm, type: e.target.value as any })}
                  >
                    <option value="key">Ключ (Key)</option>
                    <option value="quest">Квестовый (Quest)</option>
                    <option value="artifact">Артефакт (Artifact)</option>
                    <option value="weapon">Снаряжение</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Редкость</label>
                  <select
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-300"
                    value={itemForm.rarity}
                    onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value as any })}
                  >
                    <option value="common">Обычный (Common)</option>
                    <option value="rare">Редкий (Rare)</option>
                    <option value="epic">Эпический (Epic)</option>
                    <option value="legendary">Легендарный (Legendary)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleAddItem}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
              >
                Внедрить предмет в квест
              </button>
            </div>
          </div>

          {/* Items Inventory List */}
          <div className="lg:col-span-2 bg-slate-900/20 border border-slate-850/60 p-6 rounded-3xl h-[420px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {items.map((item) => (
                <div key={item.id} className="bg-slate-950 border border-slate-850/80 p-4 rounded-2xl flex justify-between items-start group">
                  <div className="flex gap-3">
                    <span className="text-3xl bg-slate-900 border border-slate-800 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      {item.icon}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{item.name}</span>
                        <span className={`text-[8px] font-mono font-bold uppercase py-0.5 px-2 rounded-full ${
                          item.rarity === 'legendary' ? 'bg-amber-500/10 text-amber-400' :
                          item.rarity === 'epic' ? 'bg-purple-500/10 text-purple-400' :
                          item.rarity === 'rare' ? 'bg-sky-500/10 text-sky-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{item.description || 'Без описания...'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                  Нет созданных предметов. Вы можете привязывать эти предметы к наградам за этапы.
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ACHIEVEMENTS DESIGNER */}
      {activeSection === 'achievements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Achievement Creation */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-400" /> Создать достижение
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Название ачивки</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-white"
                    placeholder="Первооткрыватель"
                    value={achForm.name || ''}
                    onChange={(e) => setAchForm({ ...achForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Иконка</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-center text-white"
                    placeholder="👑"
                    value={achForm.icon || ''}
                    onChange={(e) => setAchForm({ ...achForm, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Описание условий получения</label>
                <textarea
                  className="w-full h-16 bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-white resize-none"
                  placeholder="Выдается за посещение Сфинкса..."
                  value={achForm.description || ''}
                  onChange={(e) => setAchForm({ ...achForm, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Бонус (XP)</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-white"
                    value={achForm.xpReward || ''}
                    onChange={(e) => setAchForm({ ...achForm, xpReward: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Критерий триггера</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2 text-slate-300"
                    placeholder="completion-step-1"
                    value={achForm.conditions || ''}
                    onChange={(e) => setAchForm({ ...achForm, conditions: e.target.value })}
                  />
                </div>
              </div>

              <button
                onClick={handleAddAchievement}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
              >
                Зарегистрировать достижение
              </button>
            </div>
          </div>

          {/* Achievements List */}
          <div className="lg:col-span-2 bg-slate-900/20 border border-slate-850/60 p-6 rounded-3xl h-[420px] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {achievements.map((ach) => (
                <div key={ach.id} className="bg-slate-950 border border-slate-850/80 p-4 rounded-2xl flex justify-between items-start">
                  <div className="flex gap-3">
                    <span className="text-3xl bg-slate-900 border border-slate-800 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
                      {ach.icon}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-white">{ach.name}</span>
                        <span className="text-[8px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 py-0.5 px-2 rounded-full">
                          +{ach.xpReward} XP
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{ach.description || 'Без описания...'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAchievement(ach.id)}
                    className="p-1 bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {achievements.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-500 text-xs">
                  Достижений пока нет. Порадуйте игроков наградами за внимательность!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LEVELS XP CONFIGURATOR */}
      {activeSection === 'levels' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Create Level */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
            <h3 className="font-display font-bold text-white text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" /> Добавить уровень
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Уровень №</label>
                  <input
                    type="number"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-white font-mono"
                    placeholder="5"
                    value={lvlForm.level || ''}
                    onChange={(e) => setLvlForm({ ...lvlForm, level: parseInt(e.target.value) || undefined })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-slate-400 uppercase">Эмодзи ранга</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-center text-white"
                    placeholder="🎖️"
                    value={lvlForm.icon || ''}
                    onChange={(e) => setLvlForm({ ...lvlForm, icon: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Звание / Название ранга</label>
                <input
                  type="text"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-white"
                  placeholder="Магистр истории"
                  value={lvlForm.title || ''}
                  onChange={(e) => setLvlForm({ ...lvlForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase">Требуемый Опыт (Суммарный XP)</label>
                <input
                  type="number"
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-white font-mono"
                  placeholder="5000"
                  value={lvlForm.xpRequired || ''}
                  onChange={(e) => setLvlForm({ ...lvlForm, xpRequired: parseInt(e.target.value) || 0 })}
                />
              </div>

              <button
                onClick={handleAddLevel}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs"
              >
                Сохранить уровень
              </button>
            </div>
          </div>

          {/* Level Curve List */}
          <div className="lg:col-span-2 bg-slate-900/20 border border-slate-850/60 p-6 rounded-3xl h-[420px] overflow-y-auto">
            <div className="space-y-2">
              {levels.map((lvl) => (
                <div key={lvl.level} className="bg-slate-950 border border-slate-850/75 p-3.5 rounded-2xl flex justify-between items-center hover:border-slate-800">
                  <div className="flex items-center gap-4">
                    <span className="text-xl bg-slate-900 border border-slate-800 w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-white shrink-0">
                      {lvl.level}
                    </span>
                    <span className="text-2xl">{lvl.icon}</span>
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-white block">{lvl.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">Порог: {lvl.xpRequired} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {lvl.level !== 1 ? (
                      <button
                        onClick={() => handleDeleteLevel(lvl.level)}
                        className="p-1 bg-slate-900 hover:bg-red-950 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-900">Базовый</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
