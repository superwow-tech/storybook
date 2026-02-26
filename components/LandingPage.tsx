
import React from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface Props {
  onStart: () => void;
  language: Language;
}

const LandingPage: React.FC<Props> = ({ onStart, language }) => {
  const t = translations[language];
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background elements to simulate the garden */}
      <div 
        className="absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none" 
        style={{ 
          background: "url('https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2000&auto=format&fit=crop') center/cover",
          filter: "blur(4px)"
        }} 
      />
      
      <div className="max-w-md w-full bg-white/40 backdrop-blur-md rounded-[2.5rem] p-10 text-center relative z-10 transform hover:scale-[1.01] transition-all shadow-2xl">
        <h1 className="text-5xl font-magic text-[#4a5d23] mb-2 tracking-tight">Magic Dziulis</h1>
        
        {/* Decorative divider */}
        <div className="flex justify-center items-center gap-2 mb-8 text-[#749e47]">
          <span className="w-8 h-[2px] bg-[#749e47] rounded-full opacity-30"></span>
          <span className="w-2 h-2 bg-[#749e47] rounded-full opacity-50"></span>
          <span className="w-8 h-[2px] bg-[#749e47] rounded-full opacity-30"></span>
        </div>

        <p className="text-[#4a5d23]/80 mb-8 font-medium leading-relaxed">
          {t.tagline}
        </p>
        
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-br from-[#9bbf6b] to-[#749e47] text-white font-magic text-2xl sm:text-3xl py-4 px-4 rounded-2xl transition-all flex flex-wrap items-center justify-center gap-2 mb-4 relative z-20 shadow-lg hover:shadow-xl active:scale-95 uppercase tracking-widest font-bold"
        >
          <span className="text-xl opacity-80">🌿</span> 
          <span className="tracking-wide leading-tight text-center">{t.startButton}</span> 
          <span className="text-xl opacity-80">🌿</span>
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
