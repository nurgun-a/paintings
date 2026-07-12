import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  ShieldAlert, 
  Award, 
  Briefcase, 
  Clock, 
  MessageSquare, 
  Send, 
  Sparkles,
  SearchCode,
  ArrowRight,
  Sliders,
  CheckCircle,
  Eye,
  Trash2,
  Filter
} from 'lucide-react';
import { PlayerProfile, ChatMessage } from '../../packages/types/index';

interface PlayersTabProps {
  players: PlayerProfile[];
  setPlayers: (players: PlayerProfile[]) => void;
}

export default function PlayersTab({ players, setPlayers }: PlayersTabProps) {
  const adminFetch = (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('admin_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    } as Record<string, string>;
    return fetch(url, { ...options, headers });
  };

  React.useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await adminFetch('/api/admin/players');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setPlayers(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch players list:', err);
      }
    };
    fetchPlayers();
    
    // Poll players list every 4 seconds for real-time monitoring and chats
    const interval = setInterval(fetchPlayers, 4000);
    return () => clearInterval(interval);
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  
  // Manual admin system override text
  const [overrideMessageText, setOverrideMessageText] = useState('');
  const [overrideSender, setOverrideSender] = useState<'gamemaster' | 'system'>('gamemaster');

  // Filter criteria
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  const selectedPlayer = players.find(p => p.userId === selectedPlayerId) || players[0];

  // Filter players list
  const filteredPlayers = players.filter(p => {
    const matchesSearch = p.username.toLowerCase().includes(searchTerm.toLowerCase()) || p.rank.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // MANUAL GAMEMASTER MESSAGE OVERRIDE TRIGGER
  const handleSendOverrideMessage = async () => {
    if (!overrideMessageText.trim() || !selectedPlayer) return;

    try {
      const res = await adminFetch(`/api/admin/players/${selectedPlayer.userId}/override-message`, {
        method: 'POST',
        body: JSON.stringify({ 
          text: overrideMessageText,
          sender: overrideSender
        })
      });
      const updatedProfile = await res.json();
      
      // Update local state list
      setPlayers(players.map(p => p.userId === selectedPlayer.userId ? updatedProfile : p));
      setOverrideMessageText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearPlayerHistory = async (userId: string) => {
    if (!confirm('Вы действительно хотите стереть всю историю диалогов и прогресс квестов этого игрока? Действие необратимо.')) return;

    try {
      const res = await adminFetch(`/api/admin/players/${userId}/reset`, { method: 'POST' });
      const resetProfile = await res.json();
      setPlayers(players.map(p => p.userId === userId ? resetProfile : p));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8" id="players-workspace-panel">
      
      {/* TITLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Мониторинг игроков и чатов</h2>
          <p className="text-slate-400 text-sm">Просматривайте активность искателей в реальном времени, инспектируйте инвентарь и отправляйте системные сообщения.</p>
        </div>
      </div>

      {/* CORE SPLIT GRID PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PLAYERS DIRECTORY LIST COLUMN */}
        <div className="space-y-4">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Поиск по имени или званию..." 
              className="w-full bg-slate-800/40 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[60vh] pr-1">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">Игроков не найдено.</div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayerId === player.userId;
                return (
                  <div 
                    key={player.userId}
                    onClick={() => setSelectedPlayerId(player.userId)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border ${
                      isSelected 
                        ? 'bg-slate-800/50 border-indigo-500' 
                        : 'bg-slate-800/10 border-slate-850 hover:border-slate-800 hover:bg-slate-800/20'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm">{player.username}</h4>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 font-bold text-indigo-400">Lvl {player.level}</span>
                          <span className="truncate max-w-[100px] font-semibold">{player.rank}</span>
                        </div>
                      </div>
                      <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 font-mono shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Онлайн
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* DETAILED PLAYER PROFILE & ACTIVE CHATS MONITOR COLUMN */}
        {selectedPlayerId && selectedPlayer ? (
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6" id="player-inspector-split">
            
            {/* SUB-COLUMN 1: USER PROFILE STATS & INVENTORY INSPECTION */}
            <div className="p-6 rounded-2xl bg-[#11131c] border border-slate-800 space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-100">{selectedPlayer.username}</h3>
                  <p className="text-xs text-indigo-400 font-semibold uppercase">{selectedPlayer.rank}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleClearPlayerHistory(selectedPlayer.userId)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors"
                    title="Очистить прогресс игрока"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedPlayerId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-900 transition-colors font-semibold text-xs"
                    title="Закрыть карточку"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Stats Indicators */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Опыт (XP)</div>
                  <div className="text-xl font-black text-amber-400">{selectedPlayer.xp} <span className="text-xs text-slate-500 font-normal">XP</span></div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Прогресс квестов</div>
                  <div className="text-xl font-black text-indigo-400">
                    {Object.values(selectedPlayer.questProgress || {}).filter(q => q?.completed).length} <span className="text-xs text-slate-500 font-normal">выполнено</span>
                  </div>
                </div>
              </div>

              {/* Backpack Inventory Items Visual Grid */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-400" />
                  Рюкзак игрока (Inventory)
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {!(selectedPlayer.inventory && selectedPlayer.inventory.length > 0) ? (
                    <div className="col-span-3 text-center py-6 text-[11px] text-slate-500">Рюкзак игрока пуст.</div>
                  ) : (
                    (selectedPlayer.inventory || []).map((item, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-center font-semibold text-xs text-slate-200 truncate" title={item}>
                        🎒 {item}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Achievements visual badges */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Достижения и знаки почета
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!(selectedPlayer.achievements && selectedPlayer.achievements.length > 0) ? (
                    <div className="text-slate-500 text-[11px]">Нет разблокированных наград.</div>
                  ) : (
                    (selectedPlayer.achievements || []).map((ach, idx) => (
                      <span key={idx} className="py-1 px-2.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                        🏆 {ach}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* SUB-COLUMN 2: LIVE DIALOGUE VIEW & BROADCAST OVERRIDES */}
            <div className="p-6 rounded-2xl bg-slate-800/15 border border-slate-800 flex flex-col justify-between max-h-[60vh]">
              
              {/* Messages viewport */}
              <div className="space-y-4 flex-1 overflow-y-auto mb-4 pr-1 min-h-[30vh]">
                <div className="flex justify-between items-center text-xs text-slate-500 font-mono pb-2 border-b border-slate-800">
                  <span>История чата Гейммастера</span>
                  <span>Логи ИИ-Ведущего</span>
                </div>

                <div className="space-y-3">
                  {/* Pull chat messages from first active quest history */}
                  {Object.values(selectedPlayer.questProgress || {}).length === 0 || 
                   !(Object.values(selectedPlayer.questProgress || {})[0]?.chatHistory && Object.values(selectedPlayer.questProgress || {})[0]?.chatHistory?.length > 0) ? (
                    <div className="text-center py-12 text-[11px] text-slate-500">Диалог еще не начат.</div>
                  ) : (
                    (Object.values(selectedPlayer.questProgress || {})[0]?.chatHistory || []).map((msg, idx) => {
                      const isPlayer = msg.sender === 'player';
                      const isSystem = msg.sender === 'system';
                      return (
                        <div 
                          key={idx}
                          className={`flex flex-col max-w-[85%] ${
                            isPlayer ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            isPlayer 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : isSystem 
                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-tl-none font-mono text-[10px]'
                                : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
                          }`}>
                            <p>{msg.text}</p>
                          </div>
                          <span className="text-[8px] text-slate-500 font-mono mt-1">
                            {msg.sender === 'player' ? 'Игрок' : msg.sender === 'gamemaster' ? 'ИИ Шаман' : 'Система'} &bull; {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Organizer overrides dispatch dock */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-500">Вмешательство Гейммастера:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setOverrideSender('gamemaster')}
                      className={`py-0.5 px-2 rounded font-bold ${overrideSender === 'gamemaster' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                      ИИ Ведущий
                    </button>
                    <button 
                      onClick={() => setOverrideSender('system')}
                      className={`py-0.5 px-2 rounded font-bold ${overrideSender === 'system' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'}`}
                    >
                      Системное оповещение
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input 
                    type="text" 
                    value={overrideMessageText}
                    onChange={(e) => setOverrideMessageText(e.target.value)}
                    placeholder="Напишите сообщение..." 
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleSendOverrideMessage()}
                  />
                  <button 
                    onClick={handleSendOverrideMessage}
                    className="absolute right-2 top-2 p-1 text-indigo-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="lg:col-span-2 flex flex-col items-center justify-center p-12 bg-slate-800/10 border border-slate-800/50 border-dashed rounded-2xl text-slate-500 font-mono text-xs text-center space-y-2">
            <span>🧙‍♂️ Карта искателя не выбрана</span>
            <span className="text-[10px] text-slate-600">Выберите искателя из списка слева, чтобы открыть инвентарь и чат гейммастера</span>
          </div>
        )}

      </div>

    </div>
  );
}
