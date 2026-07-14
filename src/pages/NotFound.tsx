import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { motion } from 'motion/react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-6 font-sans">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="bg-cyan-500/10 p-6 rounded-full text-cyan-400 border border-cyan-500/20"
      >
        <Compass className="w-16 h-16 shrink-0" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-4xl font-bold font-mono text-white">404</h1>
        <h2 className="text-lg font-bold text-slate-200 font-sans">Путь потерян</h2>
        <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
          Похоже, вы сбились со священной тропы трех миров Олонхо. Давайте вернемся к испытаниям богатыря!
        </p>
      </div>

      <button
        onClick={() => navigate('/')}
        className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
      >
        <Home className="w-4 h-4" /> Вернуться к испытаниям
      </button>
    </div>
  );
};
