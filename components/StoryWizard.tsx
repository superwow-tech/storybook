
import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface Props {
  onGenerate: (prompt: string, pageCount: number) => void;
  language: Language;
}

interface SuggestionItem {
  text: string;
  color: string;
  id: number;
}

const COLORS = [
  "bg-[#2B3A67]/60 text-[#F5E6CA] border-[#6B7FD7]/30",
  "bg-[#1e1b4b]/60 text-[#F5E6CA] border-[#6B7FD7]/30",
  "bg-[#312e81]/60 text-[#F5E6CA] border-[#6B7FD7]/30",
  "bg-[#4c1d95]/60 text-[#F5E6CA] border-[#6B7FD7]/30",
];

const StoryWizard: React.FC<Props> = ({ onGenerate, language }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [pageCount, setPageCount] = useState(5);
  const [displayedSuggestions, setDisplayedSuggestions] = useState<SuggestionItem[]>([]);
  
  const t = translations[language];
  const pageOptions = [3, 5, 7, 10];

  // Initialize and randomize suggestions
  useEffect(() => {
    const shuffle = (array: string[]) => [...array].sort(() => Math.random() - 0.5);
    const shuffledPool = shuffle(t.suggestions);
    
    const initial = shuffledPool.slice(0, 4).map((text, i) => ({
      text,
      color: COLORS[i % COLORS.length],
      id: Math.random()
    }));
    
    setDisplayedSuggestions(initial);
    setPrompt(''); // Clear prompt on language change
  }, [language]);

  // Rotate suggestions overtime
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayedSuggestions(current => {
        const indexToReplace = Math.floor(Math.random() * current.length);
        const currentlyShownTexts = current.map(s => s.text);
        const availablePool = t.suggestions.filter(s => !currentlyShownTexts.includes(s));
        
        if (availablePool.length === 0) return current;

        const newSuggestionText = availablePool[Math.floor(Math.random() * availablePool.length)];
        const newColor = COLORS[Math.floor(Math.random() * COLORS.length)];

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
  }, [language, t.suggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, pageCount);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-6 sm:space-y-8 animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] py-2 sm:py-4">
      <div className="max-w-lg mx-auto relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#312e81]/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#4c1d95]/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center px-4">
          <h2 className="text-3xl md:text-5xl font-magic mb-3 text-[#F5E6CA] leading-tight drop-shadow-md tracking-tight">
            {t.wizardTitle}
          </h2>
          <p className="text-[#A39BA8] font-bold mb-6 sm:mb-8 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase opacity-90 drop-shadow-sm">
            {t.wizardSub}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
            <div className={`group relative transition-all duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] border border-[#6B7FD7]/20 ${
              isFocused ? 'bg-[#0B1026]/60 scale-[1.01] shadow-[0_0_30px_rgba(107,127,215,0.2)]' : 'bg-[#0B1026]/40 hover:bg-[#0B1026]/50'
            }`}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t.placeholder}
                className="w-full h-24 sm:h-32 bg-transparent p-6 text-base sm:text-xl text-[#F5E6CA] placeholder:text-[#A39BA8]/50 focus:outline-none resize-none font-medium leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center min-h-[80px] sm:min-h-[100px] px-1">
              {displayedSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-[12px] font-bold transition-all hover:scale-105 active:scale-95 ${s.color} shadow-sm hover:shadow-md animate-[popIn_0.4s_ease-out] backdrop-blur-sm border border-white/5`}
                >
                  {s.text}
                </button>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className="text-[10px] font-black text-[#F4D35E] uppercase tracking-[0.2em] block opacity-80 drop-shadow-sm">
                {t.storyLength}
              </label>
              <div className="bg-[#0B1026]/40 backdrop-blur-md p-1.5 rounded-[1.5rem] sm:rounded-[2rem] flex justify-between gap-1.5 shadow-inner border border-[#6B7FD7]/20">
                {pageOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPageCount(opt)}
                    className={`flex-1 py-2 sm:py-3 px-1.5 rounded-[1.3rem] sm:rounded-[1.8rem] font-black transition-all duration-300 flex flex-col items-center justify-center gap-0.5 ${
                      pageCount === opt
                        ? 'bg-[#F4D35E] text-[#0B1026] shadow-[0_0_15px_rgba(244,211,94,0.4)] scale-105'
                        : 'text-[#A39BA8] hover:text-[#F5E6CA] hover:bg-white/5'
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
              className="w-full bg-gradient-to-br from-[#F4D35E] to-[#D4AF37] text-[#0B1026] font-magic text-xl sm:text-2xl py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 shadow-[0_0_20px_rgba(244,211,94,0.3)] hover:shadow-[0_0_30px_rgba(244,211,94,0.5)] mt-2 uppercase tracking-widest font-bold backdrop-blur-sm"
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
