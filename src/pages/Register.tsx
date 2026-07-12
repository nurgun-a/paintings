import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuest } from '../context/QuestContext';
import { motion } from 'motion/react';
import { Compass, User, Smartphone, Mail, Sparkles } from 'lucide-react';

export const Register: React.FC = () => {
  const { registerPlayer, profile } = useQuest();
  const navigate = useNavigate();

  // If already registered, redirect to home
  React.useEffect(() => {
    if (profile?.registered) {
      navigate('/');
    }
  }, [profile, navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    phone: '',
    email: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Пожалуйста, введите имя';
    if (!formData.lastName.trim()) newErrors.lastName = 'Пожалуйста, введите фамилию';
    if (!formData.username.trim()) newErrors.username = 'Пожалуйста, введите никнейм';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Пожалуйста, введите номер телефона';
    } else if (!/^\+?[0-9\- \(\)\.]{7,18}$/.test(formData.phone)) {
      newErrors.phone = 'Некорректный формат телефона';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    registerPlayer(formData);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-slate-250 flex flex-col items-center justify-center p-4 transition-colors duration-300 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#18181b] rounded-3xl shadow-2xl border border-zinc-800/80 overflow-hidden"
      >
        {/* Banner */}
        <div className="bg-[#111114] p-8 text-center text-white relative overflow-hidden border-b border-zinc-800/60">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.1),transparent)] pointer-events-none"></div>
          <div className="flex justify-center mb-3">
            <div className="bg-cyan-500/10 border border-cyan-500/30 p-3 rounded-2xl backdrop-blur-md text-cyan-400">
              <Compass className="w-8 h-8 animate-spin-slow" />
            </div>
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">Тайны Старого Города</h1>
          <p className="text-cyan-400/90 text-sm mt-1 font-medium font-sans">Регистрация в системе искателей</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Имя</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Иван"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border ${
                  errors.firstName 
                    ? 'border-red-500/80 focus:ring-red-500/40' 
                    : 'border-zinc-800 focus:ring-cyan-500/40'
                } bg-zinc-950 text-slate-100 outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
              />
            </div>
            {errors.firstName && <span className="text-xs text-red-400 mt-1 block">{errors.firstName}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Фамилия</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Иванов"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border ${
                  errors.lastName 
                    ? 'border-red-500/80 focus:ring-red-500/40' 
                    : 'border-zinc-800 focus:ring-cyan-500/40'
                } bg-zinc-950 text-slate-100 outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
              />
            </div>
            {errors.lastName && <span className="text-xs text-red-400 mt-1 block">{errors.lastName}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Никнейм</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Sparkles className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="explorer_2026"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border ${
                  errors.username 
                    ? 'border-red-500/80 focus:ring-red-500/40' 
                    : 'border-zinc-800 focus:ring-cyan-500/40'
                } bg-zinc-950 text-slate-100 outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
              />
            </div>
            {errors.username && <span className="text-xs text-red-400 mt-1 block">{errors.username}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Телефон</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Smartphone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-4567"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border ${
                  errors.phone 
                    ? 'border-red-500/80 focus:ring-red-500/40' 
                    : 'border-zinc-800 focus:ring-cyan-500/40'
                } bg-zinc-950 text-slate-100 outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
              />
            </div>
            {errors.phone && <span className="text-xs text-red-400 mt-1 block">{errors.phone}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email <span className="text-zinc-600">(необязательно)</span></label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="explorer@example.com"
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl border ${
                  errors.email 
                    ? 'border-red-500/80 focus:ring-red-500/40' 
                    : 'border-zinc-800 focus:ring-cyan-500/40'
                } bg-zinc-950 text-slate-100 outline-none focus:ring-2 focus:border-transparent text-sm transition-all`}
              />
            </div>
            {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email}</span>}
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3.5 rounded-xl mt-6 shadow-md transition-all flex items-center justify-center gap-2"
          >
            Создать профиль и Начать
            <Compass className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};
