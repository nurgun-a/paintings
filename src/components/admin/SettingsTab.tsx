import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Mail, 
  Database, 
  HardDrive, 
  Lock, 
  Check, 
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles,
  Save,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function SettingsTab() {
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Visibility states
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showSMTP, setShowSMTP] = useState(false);

  // Mock configuration parameters
  const [geminiKey, setGeminiKey] = useState('AIzaSyD-GeMInI_FlAsH_CoNfIgUrEd_By_PlAtFoRm');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  
  const [s3Bucket, setS3Bucket] = useState('ai-quest-platform-production-bucket');
  const [s3Region, setS3Region] = useState('us-east-1');
  
  const [smtpServer, setSmtpServer] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUser, setSmtpUser] = useState('postmaster@aiquest.org');

  const handleSaveConfigs = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-8" id="settings-tab-view">
      
      {/* TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Настройки Платформы (Keys & Integrations)</h2>
          <p className="text-slate-400 text-sm">Управляйте секретными API-ключами нейросетей, SMTP почтовым шлюзом и облачным хранилищем S3.</p>
        </div>
        <button 
          onClick={handleSaveConfigs}
          className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/10 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Сохранить все настройки</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-550/20 text-xs text-emerald-400 flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Конфигурационные параметры успешно сохранены и применены в Docker-контейнере!</span>
        </div>
      )}

      {/* THREE COLUMN GRID FOR SETTINGS GROUPS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMN 1: AI MODEL PROVIDERS (Gemini, OpenAI, Anthropic, OpenRouter) */}
        <div className="p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-5">
          <h3 className="font-extrabold text-sm uppercase text-indigo-400 flex items-center gap-2">
            <Key className="w-4 h-4" />
            Интеграция с LLM моделями
          </h3>

          <div className="space-y-4 text-xs">
            {/* Gemini */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-300">Google Gemini API Key</label>
                <button onClick={() => setShowGemini(!showGemini)} className="text-slate-500 hover:text-slate-300">
                  {showGemini ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input 
                type={showGemini ? 'text' : 'password'} 
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100 font-mono" 
              />
              <p className="text-[9px] text-slate-500">Используется по умолчанию для ИИ-Ведущего и Vision API.</p>
            </div>

            {/* OpenAI */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-bold text-slate-300">OpenAI API Key (Опционально)</label>
                <button onClick={() => setShowOpenAI(!showOpenAI)} className="text-slate-500 hover:text-slate-300">
                  {showOpenAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <input 
                type={showOpenAI ? 'text' : 'password'} 
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100 font-mono" 
              />
            </div>

            {/* Anthropic */}
            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Anthropic API Key (Claude)</label>
              <input 
                type="password" 
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100 font-mono" 
              />
            </div>
          </div>
        </div>

        {/* COLUMN 2: OBJECT STORAGE CONFIGURATION (S3, Firebase Firestore) */}
        <div className="p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-5">
          <h3 className="font-extrabold text-sm uppercase text-pink-400 flex items-center gap-2">
            <HardDrive className="w-4 h-4" />
            Хранилище файлов S3
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">S3 Bucket Name</label>
              <input 
                type="text" 
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100" 
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">S3 Region</label>
              <input 
                type="text" 
                value={s3Region}
                onChange={(e) => setS3Region(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100" 
              />
            </div>

            <div className="p-4 rounded-xl bg-indigo-500/5 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
              <h4 className="font-bold text-slate-300 mb-1">Связь с базой Firestore</h4>
              Синхронизация прогресса и сохранений настроена автоматически с Firebase-Blueprints в реальном времени.
            </div>
          </div>
        </div>

        {/* COLUMN 3: EMAIL MESSAGING SERVICE (SMTP Setup) */}
        <div className="p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-5">
          <h3 className="font-extrabold text-sm uppercase text-amber-500 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Почтовый SMTP-Сервер
          </h3>

          <div className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">SMTP Host</label>
              <input 
                type="text" 
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100" 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Порт</label>
                <input 
                  type="number" 
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100" 
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Шифрование</label>
                <select className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 text-xs focus:outline-none text-slate-200">
                  <option value="ssl">SSL / TLS</option>
                  <option value="starttls">STARTTLS</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-300 block">Имя пользователя (User)</label>
              <input 
                type="text" 
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3 focus:outline-none focus:border-indigo-500 text-slate-100" 
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
