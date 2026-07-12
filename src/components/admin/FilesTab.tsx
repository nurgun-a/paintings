import React, { useState } from 'react';
import { 
  Folder, 
  Image as ImageIcon, 
  FileText, 
  Music, 
  Video as VideoIcon, 
  UploadCloud, 
  Trash2, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  FolderPlus,
  ArrowUpRight,
  Sparkles,
  MoreVertical
} from 'lucide-react';

export default function FilesTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // File structure list mock but premium data
  const [files, setFiles] = useState([
    { id: '1', name: 'map_ancient_trail.png', type: 'image', size: '2.4 MB', path: '/uploads/images/map_ancient_trail.png', date: '08.07.2026' },
    { id: '2', name: 'shaman_ambient_theme.mp3', type: 'audio', size: '6.1 MB', path: '/uploads/audio/shaman_ambient_theme.mp3', date: '07.07.2026' },
    { id: '3', name: 'guide_booklet_ru.pdf', type: 'document', size: '1.2 MB', path: '/uploads/docs/guide_booklet_ru.pdf', date: '06.07.2026' },
    { id: '4', name: 'mystic_scenery_intro.mp4', type: 'video', size: '14.5 MB', path: '/uploads/video/mystic_scenery_intro.mp4', date: '05.07.2026' },
    { id: '5', name: 'serge_carvings_reference.jpg', type: 'image', size: '940 KB', path: '/uploads/images/serge_carvings_reference.jpg', date: '04.07.2026' }
  ]);

  const [categories, setCategories] = useState([
    { name: 'Изображения (PNG/JPG)', count: 2, icon: ImageIcon, color: 'text-pink-400 bg-pink-500/10' },
    { name: 'Аудио-эффекты (MP3)', count: 1, icon: Music, color: 'text-amber-400 bg-amber-500/10' },
    { name: 'Видео-заставки (MP4)', count: 1, icon: VideoIcon, color: 'text-rose-400 bg-rose-500/10' },
    { name: 'Книги / Документы (PDF)', count: 1, icon: FileText, color: 'text-blue-400 bg-blue-500/10' }
  ]);

  const handleCopyLink = (path: string, id: string) => {
    const fullUrl = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteFile = (id: string) => {
    if (!confirm('Удалить этот файл из хранилища?')) return;
    setFiles(files.filter(f => f.id !== id));
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const newFileObj = {
        id: `file-${Math.random().toString(36).substring(2, 7)}`,
        name: droppedFile.name,
        type: droppedFile.type.split('/')[0] || 'document',
        size: `${(droppedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        path: `/uploads/${droppedFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, '_')}`,
        date: 'Сегодня'
      };
      setFiles([...files, newFileObj]);
    }
  };

  // Create folder mock action
  const handleCreateFolder = () => {
    const folderName = prompt('Введите название новой папки:');
    if (folderName) {
      alert(`Папка "${folderName}" успешно создана в облачном хранилище.`);
    }
  };

  return (
    <div className="space-y-8" id="files-explorer-tab">
      
      {/* TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Облачный менеджер файлов</h2>
          <p className="text-slate-400 text-sm">Управляйте звуковым сопровождением, логотипами квестов, видео и материалами QR кодов.</p>
        </div>
        <button 
          onClick={handleCreateFolder}
          className="py-2 px-4 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <FolderPlus className="w-4 h-4 text-indigo-400" />
          <span>Создать папку</span>
        </button>
      </div>

      {/* QUICK CATEGORIES TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, idx) => {
          const Icon = cat.icon;
          return (
            <div key={idx} className="p-4 rounded-xl bg-slate-800/10 border border-slate-800 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${cat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs text-slate-400 font-semibold">{cat.name}</h4>
                <span className="font-mono text-sm font-bold text-slate-200">{cat.count} объектов</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* COMPACT CLOUD FILE LIST AND DRAG DROP AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FILES MAIN DATA-TABLE */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени файла или типу..." 
              className="w-full bg-slate-800/20 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-2xl bg-[#11131c] border border-slate-800 overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] uppercase font-bold">
                  <th className="pb-3 pl-2">Файл</th>
                  <th className="pb-3">Размер</th>
                  <th className="pb-3">Дата изменения</th>
                  <th className="pb-3 pr-2 text-right">Управление</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).map((file) => (
                  <tr key={file.id} className="hover:bg-slate-800/10 transition-colors">
                    <td className="py-3.5 pl-2 flex items-center gap-3 font-semibold text-slate-200">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-indigo-400">
                        {file.type === 'image' && <ImageIcon className="w-4 h-4" />}
                        {file.type === 'audio' && <Music className="w-4 h-4" />}
                        {file.type === 'document' && <FileText className="w-4 h-4" />}
                        {file.type === 'video' && <VideoIcon className="w-4 h-4" />}
                      </div>
                      <div className="truncate max-w-[180px]" title={file.name}>
                        {file.name}
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-slate-400">{file.size}</td>
                    <td className="py-3.5 text-slate-400">{file.date}</td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleCopyLink(file.path, file.id)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-indigo-400 transition-all"
                          title="Скопировать URL"
                        >
                          {copiedId === file.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteFile(file.id)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-red-400 transition-all"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DRAG AND DROP FILE UPLOAD AREA */}
        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`p-6 rounded-2xl border-2 border-dashed flex flex-col justify-center items-center text-center p-8 transition-all ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
              : 'border-slate-800 bg-slate-800/10 text-slate-400 hover:border-slate-700'
          }`}
          id="file-uploader-dragdrop"
        >
          <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
            <UploadCloud className="w-7 h-7" />
          </div>
          <h4 className="font-extrabold text-sm text-slate-200 mb-1">Перетащите файлы сюда</h4>
          <p className="text-[11px] text-slate-500 max-w-xs mb-4">Поддерживаются картинки PNG/JPG, треки MP3, видео MP4 до 50MB.</p>
          
          <label className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors">
            Выбрать файл на ПК
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach((f: any) => {
                    const newFileObj = {
                      id: `file-${Math.random().toString(36).substring(2, 7)}`,
                      name: f.name,
                      type: f.type.split('/')[0] || 'document',
                      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
                      path: `/uploads/${f.name.toLowerCase().replace(/[^a-z0-9.]+/g, '_')}`,
                      date: 'Сегодня'
                    };
                    setFiles(prev => [...prev, newFileObj]);
                  });
                }
              }} 
            />
          </label>
        </div>

      </div>

    </div>
  );
}
