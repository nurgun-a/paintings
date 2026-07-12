import React from 'react';
import { Globe, Clock, User, Layers, Shield, Users } from 'lucide-react';
import { CMSProject } from '../types';

interface GeneralInfoTabProps {
  project: Partial<CMSProject>;
  onChange: (updated: Partial<CMSProject>) => void;
}

export default function GeneralInfoTab({ project, onChange }: GeneralInfoTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="cms-general-info">
      
      {/* LEFT COLUMN: BASIC METADATA */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-bold text-lg text-white">Основная информация</h3>
          
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase">Название квеста *</label>
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Например: Дух Иччи (Spirit of Ichchi)"
              value={project.name || ''}
              onChange={(e) => onChange({ name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-400 uppercase">Описание проекта</label>
            <textarea
              className="w-full h-32 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Краткое интригующее введение для привлечения игроков..."
              value={project.description || ''}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase">Обложка (Эмодзи или Ссылка)</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="🏞️ или https://example.com/cover.jpg"
                value={project.coverImage || ''}
                onChange={(e) => onChange({ coverImage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase">Иконка проекта</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="🔮"
                value={project.icon || '🔮'}
                onChange={(e) => onChange({ icon: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl space-y-4">
          <h3 className="font-display font-bold text-lg text-white">Параметры прохождения</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> Основной Язык
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={project.language || 'ru'}
                onChange={(e) => onChange({ language: e.target.value as any })}
              >
                <option value="ru">Русский (RU)</option>
                <option value="en">English (EN)</option>
                <option value="de">Deutsch (DE)</option>
                <option value="cn">中文 (CN)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Категория
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                placeholder="Например: Мистика, Музей, Детектив"
                value={project.category || ''}
                onChange={(e) => onChange({ category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" /> Возрастной ценз
              </label>
              <select
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                value={project.ageLimit || '12+'}
                onChange={(e) => onChange({ ageLimit: e.target.value })}
              >
                <option value="0+">0+</option>
                <option value="6+">6+</option>
                <option value="12+">12+</option>
                <option value="16+">16+</option>
                <option value="18+">18+</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Количество игроков
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                placeholder="1-4 игрока, Команды"
                value={project.playersCount || ''}
                onChange={(e) => onChange({ playersCount: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Продолжительность (мин)
              </label>
              <input
                type="number"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                placeholder="90"
                value={project.durationMinutes || ''}
                onChange={(e) => onChange({ durationMinutes: parseInt(e.target.value) || undefined })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Автор сценария
              </label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                placeholder="Имя или Название студии"
                value={project.authorName || ''}
                onChange={(e) => onChange({ authorName: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: PREVIEW PANEL */}
      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 sticky top-6">
          <h4 className="font-display font-bold text-sm text-slate-300 uppercase tracking-wider">Карточка проекта в каталоге</h4>
          
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col items-center justify-center p-4 text-center group">
            {project.coverImage && project.coverImage.startsWith('http') ? (
              <img src={project.coverImage} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : (
              <div className="text-5xl mb-2 animate-bounce">{project.coverImage || '🏞️'}</div>
            )}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 text-[10px] text-indigo-400 font-mono py-1 px-2.5 rounded-full uppercase">
              {project.category || 'Без категории'}
            </div>
            
            <div className="z-10 mt-auto">
              <h4 className="font-display font-bold text-lg text-white tracking-tight">{project.name || 'Название квеста'}</h4>
              <p className="text-xs text-slate-300 line-clamp-2 px-4 mt-1">{project.description || 'Нет описания...'}</p>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Версия:</span>
              <span className="text-slate-300">{project.versionString || '1.0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Возраст:</span>
              <span className="text-slate-300">{project.ageLimit || '12+'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Игроки:</span>
              <span className="text-slate-300">{project.playersCount || '1'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Время:</span>
              <span className="text-slate-300">{project.durationMinutes ? `${project.durationMinutes} мин` : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Автор:</span>
              <span className="text-indigo-400 truncate max-w-[120px]">{project.authorName || 'Аноним'}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
