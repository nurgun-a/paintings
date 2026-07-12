import React, { useState, useEffect } from 'react';
import { 
  Send, Smartphone, Compass, MapPin, QrCode, Camera, Award, ShieldAlert, Sparkles, User, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { CMSProject } from './types';
import { QuestStep, NPC, ChatMessage } from '../../../packages/types/index';

interface CMSSimulatorProps {
  project: Partial<CMSProject>;
}

export default function CMSSimulator({ project }: CMSSimulatorProps) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // Simulation user profile
  const [simXP, setSimXP] = useState(0);
  const [simLevel, setSimLevel] = useState(1);
  const [simInventory, setSimInventory] = useState<string[]>([]);
  const [simAchievements, setSimAchievements] = useState<string[]>([]);

  // Simulation Chat History
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loadingResponse, setLoadingResponse] = useState(false);

  const steps = project.steps || [];
  const npcs = project.npcs || [];
  const activeNpc = npcs[0] || { id: 'guide', name: 'ИИ Ведущий', role: 'Гид', personality: '', avatar: '🧙‍♂️' };

  const activeStep: QuestStep | undefined = steps[currentStepIdx];

  // Restart the simulation when the project is updated
  const handleResetSimulation = () => {
    setCurrentStepIdx(0);
    setCompleted(false);
    setSimXP(0);
    setSimLevel(1);
    setSimInventory([]);
    setSimAchievements([]);
    setChatHistory([
      {
        sender: 'gamemaster',
        text: `Приветствую! Я ${activeNpc.name}. Я твой ИИ-проводник в квесте "${project.name || 'Таинственный Квест'}". ${project.lore?.story ? `Предыстория квеста: ${project.lore.story.substring(0, 100)}...` : ''}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      {
        sender: 'system',
        text: `Квест запущен. Первое задание: "${steps[0]?.title || 'Начало'}" — ${steps[0]?.description || 'Выполните стартовые инструкции.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  useEffect(() => {
    handleResetSimulation();
  }, [project.id, steps.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'player',
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setInputMessage('');
    setLoadingResponse(true);

    // Dynamic Mock-Free Verification Checks inside the visual sandbox
    setTimeout(() => {
      let isVerified = false;
      let systemNotice = '';
      let rewardText = '';

      if (activeStep) {
        if (activeStep.type === 'TEXT') {
          const answers = activeStep.verificationData?.answers || [];
          const trimmed = userMsg.text.toLowerCase().trim();
          if (answers.includes(trimmed)) {
            isVerified = true;
          }
        }
      }

      if (isVerified && activeStep) {
        systemNotice = `Решение верное! Этап "${activeStep.title}" успешно пройден!`;
        
        // Grant rewards
        const xpGained = activeStep.reward.xp || 100;
        setSimXP(prev => prev + xpGained);
        if (simXP + xpGained >= 250) {
          setSimLevel(prev => prev + 1);
        }

        if (activeStep.reward.item) {
          setSimInventory(prev => [...prev, activeStep.reward.item!]);
          rewardText += ` Получен предмет: [${activeStep.reward.item}]!`;
        }
        if (activeStep.reward.achievement) {
          setSimAchievements(prev => [...prev, activeStep.reward.achievement!]);
          rewardText += ` Разблокирована ачивка: [${activeStep.reward.achievement}]!`;
        }

        // Advance step
        const nextIdx = currentStepIdx + 1;
        if (nextIdx < steps.length) {
          setCurrentStepIdx(nextIdx);
          setChatHistory(prev => [
            ...prev,
            {
              sender: 'system',
              text: `${systemNotice}${rewardText}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            {
              sender: 'gamemaster',
              text: `Отлично справились! Переходим к следующему этапу: "${steps[nextIdx].title}". Инструкция: ${steps[nextIdx].description}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        } else {
          setCompleted(true);
          setChatHistory(prev => [
            ...prev,
            {
              sender: 'system',
              text: `Квест полностью выполнен! Поздравляем с победой!${rewardText}`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            },
            {
              sender: 'gamemaster',
              text: `Вы дошли до финала и разгадали все загадки! Твой итоговый ранг: Мастер. Спасибо за участие!`,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } else {
        // AI conversational response simulation using character prompts
        const aiReplies = [
          `Хмм, "${userMsg.text}" — интересная мысль, но не совсем верно. Попробуй подумать еще раз!`,
          `Я — ${activeNpc.name}. Я ценю твое рвение, но ответ не подходит. Помни мои правила!`,
          `Ой! Стены задрожали... Ответ неверный. Посмотри подсказку в описании этапа.`,
          `Это не то, что я ожидал услышать. Возможно, ответ скрывается прямо у тебя под носом?`
        ];
        const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];

        setChatHistory(prev => [
          ...prev,
          {
            sender: 'gamemaster',
            text: randomReply,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      setLoadingResponse(false);
    }, 1000);
  };

  // Simulating sensor inputs inside the viewport sandbox
  const handleSimulateGPS = () => {
    if (!activeStep || activeStep.type !== 'LOCATION') {
      alert('Данный этап не требует GPS проверки!');
      return;
    }
    const xpGained = activeStep.reward.xp || 100;
    setSimXP(prev => prev + xpGained);
    
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'system',
        text: `📍 GPS координаты подтверждены! Вы вошли в зону радиуса: ${activeStep.verificationData.coords?.radius || 50}м.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Advance
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < steps.length) {
      setCurrentStepIdx(nextIdx);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'gamemaster',
          text: `Отличный ориентир! Твое новое задание: "${steps[nextIdx].title}". Описание: ${steps[nextIdx].description}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setCompleted(true);
    }
  };

  const handleSimulateQR = () => {
    if (!activeStep || activeStep.type !== 'QR') {
      alert('Данный этап не требует сканирования QR!');
      return;
    }
    const xpGained = activeStep.reward.xp || 100;
    setSimXP(prev => prev + xpGained);
    
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'system',
        text: `🔲 QR код отсканирован! Содержимое: "${activeStep.verificationData.qrCode || 'ancient-key'}"`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Advance
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < steps.length) {
      setCurrentStepIdx(nextIdx);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'gamemaster',
          text: `Взлом завершен! Твое новое задание: "${steps[nextIdx].title}". Описание: ${steps[nextIdx].description}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setCompleted(true);
    }
  };

  const handleSimulatePhoto = () => {
    if (!activeStep || activeStep.type !== 'PHOTO') {
      alert('Данный этап не требует проверки фото!');
      return;
    }
    const xpGained = activeStep.reward.xp || 100;
    setSimXP(prev => prev + xpGained);
    
    setChatHistory(prev => [
      ...prev,
      {
        sender: 'system',
        text: `📸 Камера активирована. Отправлено фото на анализ Vision AI. Совпадение с "${activeStep.verificationData.referenceImage || 'объектом'}" составило 94%!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);

    // Advance
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < steps.length) {
      setCurrentStepIdx(nextIdx);
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'gamemaster',
          text: `Великолепный снимок! Двигаемся дальше: "${steps[nextIdx].title}". Описание: ${steps[nextIdx].description}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setCompleted(true);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4" id="cms-simulator-container">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <h3 className="font-display font-bold text-white text-sm flex items-center gap-1.5">
            <Smartphone className="w-4.5 h-4.5 text-indigo-400" />
            Интерактивный симулятор PWA квеста
          </h3>
          <p className="text-[10px] text-slate-500">Позволяет протестировать сценарий и ИИ-Ведущего на лету без публикации</p>
        </div>

        <button
          onClick={handleResetSimulation}
          className="px-3 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 font-mono text-[10px] font-bold rounded-lg transition-colors"
        >
          🔄 Начать симуляцию заново
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MOBILE FRAME VIEWPORT */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-80 h-[520px] rounded-[40px] border-8 border-slate-950 bg-slate-950 overflow-hidden shadow-2xl relative flex flex-col justify-between">
            
            {/* PHONE SPEAKER/CAMERA NOTCH */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 rounded-b-xl z-50 flex items-center justify-center">
              <span className="w-12 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* SIMULATOR PWA APP HEADER */}
            <div className="bg-slate-900 border-b border-slate-850/80 px-4 pt-8 pb-3 flex items-center justify-between text-xs font-semibold text-white">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">{activeNpc.avatar}</span>
                <div>
                  <span className="font-bold block text-[11px] leading-tight">{activeNpc.name}</span>
                  <span className="text-[9px] font-mono text-emerald-400">● В сети</span>
                </div>
              </div>
              
              <div className="bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850 text-[9px] font-mono text-indigo-400">
                Ур. {simLevel}
              </div>
            </div>

            {/* CHAT THREAD PORT */}
            <div className="flex-1 bg-slate-950 p-3.5 overflow-y-auto space-y-3 scrollbar-none flex flex-col">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-0.5 animate-fadeIn ${
                    msg.sender === 'player' 
                      ? 'bg-indigo-600 text-white ml-auto rounded-tr-none' 
                      : msg.sender === 'gamemaster' 
                      ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-850/80'
                      : 'bg-indigo-950/40 border border-indigo-900/60 text-indigo-300 font-mono text-[10px] py-2 text-center max-w-full rounded-xl'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span className={`text-[8px] block text-right ${msg.sender === 'player' ? 'text-indigo-300' : 'text-slate-500'}`}>{msg.timestamp}</span>
                </div>
              ))}
              {loadingResponse && (
                <div className="bg-slate-900 border border-slate-850 text-slate-400 p-3 rounded-2xl rounded-tl-none mr-auto max-w-[85%] text-xs font-mono animate-pulse">
                  ИИ-Ведущий думает над репликой...
                </div>
              )}
            </div>

            {/* INPUT/TRIGGER PAD CONTROLS */}
            <div className="p-3 bg-slate-900 border-t border-slate-850 space-y-2">
              
              {/* Dynamic Sandbox Action buttons depending on active step type */}
              {!completed && activeStep && (
                <div className="flex gap-1.5 justify-center">
                  {activeStep.type === 'LOCATION' && (
                    <button
                      onClick={handleSimulateGPS}
                      className="w-full py-1.5 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-lg text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Симулировать GPS триггер
                    </button>
                  )}
                  {activeStep.type === 'QR' && (
                    <button
                      onClick={handleSimulateQR}
                      className="w-full py-1.5 bg-sky-600/20 hover:bg-sky-600 border border-sky-500/40 text-sky-300 hover:text-white rounded-lg text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Симулировать скан QR
                    </button>
                  )}
                  {activeStep.type === 'PHOTO' && (
                    <button
                      onClick={handleSimulatePhoto}
                      className="w-full py-1.5 bg-amber-600/20 hover:bg-amber-600 border border-amber-500/40 text-amber-300 hover:text-white rounded-lg text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" /> Симулировать Камеру
                    </button>
                  )}
                </div>
              )}

              {/* Standard text input message */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Введите решение или ответ..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={completed}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none flex-1"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={completed || loadingResponse}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors disabled:bg-slate-800"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* SIMULATOR METRICS TRACKER */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl h-fit space-y-4 font-mono text-xs text-slate-300">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" /> Профиль игрока-тестера (Live Sandbox)
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px]">УРОВЕНЬ</span>
                <span className="text-white font-bold text-sm block">{simLevel}</span>
              </div>
              <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl space-y-1">
                <span className="text-slate-500 text-[10px]">ОПЫТ (XP)</span>
                <span className="text-indigo-400 font-bold text-sm block">{simXP} XP</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 text-[10px]">ИНВЕНТАРЬ ТЕСТЕРА</span>
              <div className="flex flex-wrap gap-1">
                {simInventory.map((item, idx) => (
                  <span key={idx} className="bg-indigo-500/10 border border-indigo-950 text-indigo-400 px-2 py-1 rounded text-[10px]">
                    🎒 {item}
                  </span>
                ))}
                {simInventory.length === 0 && (
                  <span className="text-slate-500 italic text-[10px]">Пусто</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-slate-500 text-[10px]">ДОСТИЖЕНИЯ ТЕСТЕРА</span>
              <div className="flex flex-wrap gap-1">
                {simAchievements.map((ach, idx) => (
                  <span key={idx} className="bg-emerald-500/10 border border-emerald-950 text-emerald-400 px-2 py-1 rounded text-[10px]">
                    🏆 {ach}
                  </span>
                ))}
                {simAchievements.length === 0 && (
                  <span className="text-slate-500 italic text-[10px]">Нет</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-indigo-950/10 border border-indigo-900/40 p-5 rounded-2xl">
            <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 mb-1.5 font-display">
              <ShieldAlert className="w-4.5 h-4.5" /> Справка симулятора
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Вы можете прямо во время теста вернуться во вкладку "Квесты" или "NPC", поменять фразу-ответ или изменить реплику характера, вернуться сюда и проверить реакцию без необходимости долгой сборки!
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
