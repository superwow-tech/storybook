
import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { Language, Theme } from '../types';

interface Props {
  onGenerate: (prompt: string, pageCount: number) => void;
  language: Language;
  theme: Theme;
}

interface SuggestionItem {
  text: string;
  color: string;
  id: number;
}

const DARK_COLORS = [
  "bg-[#1E1B4B]/80 text-[#FDE68A] border-[#4C1D95]/50",
  "bg-[#312E81]/80 text-[#FDE68A] border-[#4338CA]/50",
  "bg-[#4C1D95]/80 text-[#FDE68A] border-[#6D28D9]/50",
  "bg-[#172554]/80 text-[#FDE68A] border-[#1E3A8A]/50",
];

const LIGHT_COLORS = [
  "bg-[#DCFCE7]/80 text-[#14532D] border-[#86EFAC]/50",
  "bg-[#FEF9C3]/80 text-[#713F12] border-[#FDE047]/50",
  "bg-[#E0F2FE]/80 text-[#0C4A6E] border-[#7DD3FC]/50",
  "bg-[#FCE7F3]/80 text-[#831843] border-[#F9A8D4]/50",
];

const StoryWizard: React.FC<Props> = ({ onGenerate, language, theme }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [pageCount, setPageCount] = useState(5);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<SuggestionItem[]>([]);
  
  const t = translations[language];
  const pageOptions = [3, 5, 7, 10];
  const isDark = theme === 'dark';
  const currentColors = isDark ? DARK_COLORS : LIGHT_COLORS;

  // Initialize and randomize suggestions
  useEffect(() => {
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);
    const shuffledPool = shuffle(t.suggestions);
    
    const initial = shuffledPool.slice(0, 4).map((text, i) => ({
      text,
      color: currentColors[i % currentColors.length],
      id: Math.random()
    }));
    
    setDisplayedSuggestions(initial);
    setPrompt(''); // Clear prompt on language change
  }, [language, theme]); // Re-run when theme changes to update colors

  // Rotate suggestions overtime
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedSuggestions(current => {
        const indexToReplace = Math.floor(Math.random() * current.length);
        const currentlyShownTexts = current.map(s => s.text);
        const availablePool = t.suggestions.filter(s => !currentlyShownTexts.includes(s));
        
        if (availablePool.length === 0) return current;

        const newSuggestionText = availablePool[Math.floor(Math.random() * availablePool.length)];
        const newColor = currentColors[Math.floor(Math.random() * currentColors.length)];

        const next = [...current];
        next[indexToReplace] = {
          text: newSuggestionText,
          color: newColor,
          id: Math.random()
        };
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, [language, t.suggestions, theme]);

  const handleSuggestionClick = (text: string) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setPrompt(text);
  };

  const handlePageCountChange = (opt: number) => {
    if (navigator.vibrate) navigator.vibrate(15);
    setPageCount(opt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      if (navigator.vibrate) navigator.vibrate(40);
      onGenerate(prompt, pageCount);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6 sm:space-y-8 animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] py-2 sm:py-4">
      <div className="max-w-lg mx-auto relative">
        <div className={`absolute -top-24 -left-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${isDark ? 'bg-[#4C1D95]/20' : 'bg-[#FEF08A]/40'}`} />
        <div className={`absolute -bottom-24 -right-24 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${isDark ? 'bg-[#1D4ED8]/20' : 'bg-[#86EFAC]/40'}`} />

        <div className="relative z-10 text-center px-4">
          <p className={`font-bold mb-6 sm:mb-8 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase opacity-90 drop-shadow-sm ${isDark ? 'text-[#FCD34D]' : 'text-[#166534]'}`}>
            {t.wizardSub}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
            <div className={`group relative transition-all duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] ${
              isFocused 
                ? (isDark ? 'bg-[#1A1B41]/80 scale-[1.01] shadow-[0_0_30px_rgba(76,29,149,0.3)]' : 'bg-white/90 scale-[1.01] shadow-[0_0_30px_rgba(187,247,208,0.4)]')
                : (isDark ? 'bg-[#1A1B41]/60 hover:bg-[#1A1B41]/70' : 'bg-[#FEFCE8]/60 hover:bg-white/70')
            }`}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t.wizardTitle}
                className={`w-full h-28 sm:h-32 bg-transparent p-5 text-base sm:text-xl placeholder:text-opacity-50 focus:outline-none resize-none font-medium leading-relaxed scrollbar-hide ${isDark ? 'text-[#FEF3C7] placeholder:text-[#9CA3AF]' : 'text-[#166534] placeholder:text-[#166534]/50'}`}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center min-h-[80px] sm:min-h-[100px] px-1">
              {displayedSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSuggestionClick(s.text)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[12px] sm:text-[14px] font-bold transition-all hover:scale-105 active:scale-90 ${s.color} shadow-sm hover:shadow-md animate-[popIn_0.4s_ease-out] backdrop-blur-sm`}
                >
                  {s.text}
                </button>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className={`text-[10px] font-black uppercase tracking-[0.2em] block opacity-80 drop-shadow-sm ${isDark ? 'text-[#FCD34D]' : 'text-[#166534]'}`}>
                {t.storyLength}
              </label>
              <div className={`backdrop-blur-md p-1.5 rounded-[1.5rem] sm:rounded-[2rem] flex justify-between gap-1.5 shadow-inner ${isDark ? 'bg-[#0B0F19]/40' : 'bg-white/40'}`}>
                {pageOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handlePageCountChange(opt)}
                    className={`flex-1 py-2 sm:py-3 px-1.5 rounded-[1.3rem] sm:rounded-[1.8rem] font-black transition-all duration-300 flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      pageCount === opt
                        ? (isDark ? 'bg-[#FCD34D] text-[#451A03] shadow-[0_0_15px_rgba(252,211,77,0.4)] scale-105' : 'bg-[#3B82F6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105')
                        : (isDark ? 'text-[#D1D5DB] hover:text-[#FEF3C7] hover:bg-white/5' : 'text-[#166534] hover:text-[#064E3B] hover:bg-white/20')
                    }`}
                  >
                    <span className="text-sm sm:text-base leading-none">{opt}</span>
                    <span className="text-[7px] sm:text-[9px] opacity-60 uppercase tracking-wide leading-none">{t.pages}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!prompt.trim()}
              className={`w-full font-magic text-xl sm:text-2xl py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 mt-2 uppercase tracking-widest font-bold backdrop-blur-sm ${isDark ? 'bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] text-[#451A03] shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'}`}
            >
              {t.createButton}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.8) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default StoryWizard;
