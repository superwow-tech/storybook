
import React, { useEffect, useState } from 'react';
import { get, set } from 'idb-keyval';
import { translations } from '../translations';
import { Language, Theme } from '../types';
import { gemini } from '../geminiService';

interface Props {
  onStart: () => void;
  language: Language;
  theme: Theme;
}

const WELCOME_IMAGE_KEY = 'magic_dziulis_welcome_image';

const LandingPage: React.FC<Props> = ({ onStart, language, theme }) => {
  const t = translations[language];
  const [welcomeImage, setWelcomeImage] = useState<string | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    const loadWelcomeImage = async () => {
      try {
        // Try to get from storage first
        const cached = await get(WELCOME_IMAGE_KEY);
        if (cached) {
          setWelcomeImage(cached);
          return;
        }

        // Generate if not found
        const prompt = "A whimsical digital illustration of a cute young wizard boy with a blue pointed hat and cape reading a glowing scroll. He is standing in a magical garden with large blue and purple flowers. Behind him is a large, twisted tree with glowing orange fruits or lanterns hanging from its branches. The background is a starry night sky with a shooting star. The style is soft, magical, and suitable for a children's storybook. High quality, detailed, 8k resolution.";
        const imageUrl = await gemini.generateImage(prompt);
        
        if (imageUrl) {
          setWelcomeImage(imageUrl);
          await set(WELCOME_IMAGE_KEY, imageUrl);
        }
      } catch (error) {
        console.error("Failed to load/generate welcome image:", error);
      }
    };

    loadWelcomeImage();
  }, []);

  const handleStartClick = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    onStart();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000 ${isDark ? 'bg-gradient-to-b from-[#0B0F19] via-[#1A1B41] to-[#2E2A5B]' : 'bg-gradient-to-b from-[#BFDBFE] via-[#D1FAE5] to-[#86EFAC]'}`}>
      {/* Background elements to simulate the garden */}
      <div 
        className={`absolute inset-0 z-0 opacity-40 mix-blend-multiply pointer-events-none ${isDark ? '' : 'hidden'}`} 
        style={{ 
          background: "url('https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=2000&auto=format&fit=crop') center/cover",
          filter: "blur(4px)"
        }} 
      />
      
      {/* Background Blobs */}
      <div className={`absolute top-0 right-0 w-[80%] h-[70%] blur-[130px] rounded-full pointer-events-none -z-10 transition-colors duration-1000 ${isDark ? 'bg-[#4C1D95]/30' : 'bg-[#7DD3FC]/50'}`} />
      <div className={`absolute bottom-0 left-0 w-[80%] h-[70%] blur-[130px] rounded-full pointer-events-none -z-10 transition-colors duration-1000 ${isDark ? 'bg-[#1D4ED8]/30' : 'bg-[#6EE7B7]/50'}`} />
      
      <div className={`max-w-md w-full backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-10 text-center relative z-10 transform hover:scale-[1.01] transition-all shadow-[0_0_40px_rgba(11,16,38,0.5)] ${isDark ? 'bg-[#23214A]/80' : 'bg-white/70'}`}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`w-12 h-12 sm:w-16 sm:h-16 filter hover:rotate-6 transition-transform duration-300 ${isDark ? 'drop-shadow-[0_0_15px_rgba(252,211,77,0.6)]' : 'drop-shadow-lg'}`}>
            <path d="M496.1 416h-27.2c-12.9 0-24.6-7.8-29.6-19.8l-15.5-37.1C412.2 331.3 367.8 248.8 306.6 128c-3.2-6.4-23.7-58.6-23.7-58.6s-9.8-23.2-16.1-23.2h-21.6c-6.3 0-16.1 23.2-16.1 23.2S208.6 121.6 205.4 128c-61.2 120.8-105.6 203.3-117.2 231.1l-15.5 37.1c-5 12-16.7 19.8-29.6 19.8H15.9c-10.8 0-18.7 10.3-15.5 20.6l10.8 34.6c2.4 7.6 9.4 12.8 17.4 12.8h454.8c8 0 15-5.2 17.4-12.8l10.8-34.6c3.2-10.3-4.7-20.6-15.5-20.6z" fill={isDark ? "#3730A3" : "#3B82F6"}/>
            <path d="M336.6 362.3c-15.8 12.5-35.7 19.8-57.1 19.8-23.5 0-45.1-8.8-61.6-23.3l-20.3 48.6c19.7 20.6 47.6 33.6 78.4 33.6 33.3 0 63.2-15.2 82.8-39.1l-22.2-39.6z" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
            <path d="M256 160l-17.9 36.3-40.1 5.8 29 28.3-6.8 39.9 35.8-18.8 35.8 18.8-6.8-39.9 29-28.3-40.1-5.8L256 160z" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
            <circle cx="180" cy="280" r="12" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
            <circle cx="340" cy="250" r="8" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
          </svg>
          <h1 className={`text-4xl sm:text-5xl font-magic tracking-tight drop-shadow-lg ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>Magic Dziulis</h1>
        </div>
        
        {/* Welcome Image */}
        <div className={`w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-2xl relative group ${isDark ? 'bg-[#312E81]/40' : 'bg-white/50'}`}>
          {welcomeImage ? (
            <img 
              src={welcomeImage} 
              alt="Magic Wizard" 
              className="w-full h-full object-cover animate-[fadeIn_1s_ease-out] transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-8 h-8 border-4 rounded-full animate-spin ${isDark ? 'border-[#FCD34D]/30 border-t-[#FCD34D]' : 'border-[#3B82F6]/30 border-t-[#3B82F6]'}`} />
            </div>
          )}
        </div>

        {/* Decorative divider */}
        <div className={`flex justify-center items-center gap-2 mb-6 sm:mb-8 ${isDark ? 'text-[#FCD34D]' : 'text-[#3B82F6]'}`}>
          <span className={`w-8 h-[2px] rounded-full opacity-30 ${isDark ? 'bg-[#FCD34D]' : 'bg-[#3B82F6]'}`}></span>
          <span className={`w-2 h-2 rounded-full opacity-50 ${isDark ? 'bg-[#FCD34D]' : 'bg-[#3B82F6]'}`}></span>
          <span className={`w-8 h-[2px] rounded-full opacity-30 ${isDark ? 'bg-[#FCD34D]' : 'bg-[#3B82F6]'}`}></span>
        </div>

        <p className={`mb-6 sm:mb-8 font-medium leading-relaxed text-sm sm:text-base ${isDark ? 'text-[#D1D5DB]' : 'text-[#166534]'}`}>
          {t.tagline}
        </p>
        
        <button
          onClick={handleStartClick}
          className={`w-full font-magic text-xl sm:text-3xl py-3 sm:py-4 px-4 rounded-2xl transition-all flex flex-wrap items-center justify-center gap-2 mb-4 relative z-20 hover:brightness-110 active:scale-95 uppercase tracking-widest font-bold ${isDark ? 'bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] text-[#451A03] shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)]' : 'bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]'}`}
        >
          <span className="tracking-wide leading-tight text-center">{t.startButton}</span> 
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
