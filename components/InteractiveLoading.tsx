import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { Language, Theme } from '../types';

interface Props {
  language: Language;
  theme: Theme;
}

interface Particle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  size: number;
  bgClass: string;
  hexColor: string;
}

const InteractiveLoading: React.FC<Props> = ({ language, theme }) => {
  const t = translations[language];
  const isDark = theme === 'dark';
  const [messageIdx, setMessageIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  const colors = isDark 
    ? [
        { bg: 'bg-[#FCD34D]', hex: '#FCD34D' }, 
        { bg: 'bg-[#A78BFA]', hex: '#A78BFA' }, 
        { bg: 'bg-[#60A5FA]', hex: '#60A5FA' }, 
        { bg: 'bg-[#F472B6]', hex: '#F472B6' }
      ]
    : [
        { bg: 'bg-[#F59E0B]', hex: '#F59E0B' }, 
        { bg: 'bg-[#8B5CF6]', hex: '#8B5CF6' }, 
        { bg: 'bg-[#3B82F6]', hex: '#3B82F6' }, 
        { bg: 'bg-[#EC4899]', hex: '#EC4899' }
      ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx((prev) => (prev + 1) % t.loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [t.loadingMessages.length]);

  useEffect(() => {
    const initial = Array.from({ length: 15 }).map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: i,
        left: Math.random() * 90 + 5 + '%',
        delay: Math.random() * 5 + 's',
        duration: Math.random() * 4 + 4 + 's',
        size: Math.random() * 20 + 15,
        bgClass: color.bg,
        hexColor: color.hex,
      };
    });
    setParticles(initial);
  }, [isDark]);

  const handlePop = (id: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(15);
    setScore(s => s + 1);
    
    setParticles(prev => prev.map(p => {
      if (p.id === id) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        return {
          ...p,
          id: Date.now() + Math.random(),
          left: Math.random() * 90 + 5 + '%',
          delay: '0s',
          bgClass: color.bg,
          hexColor: color.hex,
        };
      }
      return p;
    }));
  };

  const handleBookClick = () => {
    if (navigator.vibrate) navigator.vibrate(25);
    setScore(s => s + 5);
    
    const burst = Array.from({ length: 8 }).map((_, i) => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: Date.now() + Math.random() + i,
        left: Math.random() * 100 + '%',
        delay: '0s',
        duration: Math.random() * 2 + 2 + 's',
        size: Math.random() * 15 + 10,
        bgClass: color.bg,
        hexColor: color.hex,
      };
    });
    setParticles(prev => [...prev, ...burst].slice(-35));
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg relative py-12 min-h-[400px]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            onClick={(e) => handlePop(p.id, e)}
            className={`absolute rounded-full cursor-pointer pointer-events-auto hover:scale-125 active:scale-90 transition-transform animate-[floatUpInteractive_var(--duration)_infinite_linear] ${p.bgClass}`}
            style={{
              width: p.size + 'px',
              height: p.size + 'px',
              left: p.left,
              bottom: '-50px',
              animationDelay: p.delay,
              '--duration': p.duration,
              boxShadow: `0 0 15px ${p.hexColor}`
            } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="relative mb-10 z-10">
        <div className={`absolute -inset-10 blur-[60px] rounded-full animate-pulse ${isDark ? 'bg-[#4C1D95]/40' : 'bg-[#BBF7D0]/60'}`} />
        <button 
          onClick={handleBookClick}
          className={`w-36 h-36 md:w-44 md:h-44 border rounded-[3.5rem] flex items-center justify-center shadow-[0_25px_60px_-10px_rgba(43,58,103,0.5)] relative overflow-hidden group active:scale-95 transition-transform cursor-pointer ${isDark ? 'bg-gradient-to-br from-[#23214A] to-[#312E81] border-[#4C1D95]/30' : 'bg-gradient-to-br from-[#F0F9FF] to-[#DCFCE7] border-[#BBF7D0]/60'}`}
        >
          <div className={`absolute inset-0 -translate-x-full animate-[sweep_4s_infinite] ${isDark ? 'bg-gradient-to-tr from-white/0 via-[#FCD34D]/10 to-white/0' : 'bg-gradient-to-tr from-white/0 via-[#3B82F6]/10 to-white/0'}`} />
          <div className={`relative z-10 animate-[bookFlap_2s_infinite_ease-in-out] drop-shadow-[0_0_15px_rgba(252,211,77,0.3)] ${isDark ? 'text-[#FEF3C7]' : 'text-[#1E3A8A]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 md:h-24 md:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </button>
      </div>

      <div className="text-center space-y-3 relative z-10 px-6">
        <div className="h-12 overflow-hidden flex items-center justify-center">
          <p key={messageIdx} className={`text-2xl md:text-3xl font-script animate-[bounceIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)] drop-shadow-md ${isDark ? 'text-[#FEF3C7]' : 'text-[#1E3A8A]'}`}>
            {t.loadingMessages[messageIdx]}
          </p>
        </div>
        <p className={`font-bold text-xs md:text-sm tracking-[0.2em] uppercase drop-shadow-sm ${isDark ? 'text-[#FCD34D]' : 'text-[#3B82F6]'}`}>
          {score > 0 ? (language === 'en' ? `Magic collected: ${score}` : `Surinkta magijos: ${score}`) : t.waitMoment}
        </p>
      </div>
    </div>
  );
};

export default InteractiveLoading;
