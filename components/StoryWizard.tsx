
import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { Language, Story } from '../types';

interface Props {
  onGenerate: (prompt: string, pageCount: number) => void;
  language: Language;
  savedStories: Story[];
  onLoadStory: (story: Story) => void;
  onDeleteStory: (id: string) => void;
}

interface SuggestionItem {
  text: string;
  color: string;
  id: number;
}

const COLORS = [
  "bg-green-50 text-green-800 border-green-200",
  "bg-yellow-50 text-yellow-800 border-yellow-200",
  "bg-rose-50 text-rose-800 border-rose-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-blue-50 text-blue-800 border-blue-200",
  "bg-teal-50 text-teal-800 border-teal-200",
  "bg-stone-50 text-stone-800 border-stone-200"
];

const StoryWizard: React.FC<Props> = ({ onGenerate, language, savedStories, onLoadStory, onDeleteStory }) => {
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
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-white/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-yellow-200/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 text-center px-4">
          <h2 className="text-3xl md:text-5xl font-magic mb-3 text-[#4a5d23] leading-tight drop-shadow-sm tracking-tight">
            {t.wizardTitle}
          </h2>
          <p className="text-[#4a5d23] font-bold mb-6 sm:mb-8 text-[10px] sm:text-[11px] tracking-[0.15em] uppercase opacity-90 drop-shadow-sm">
            {t.wizardSub}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-8">
            <div className={`group relative transition-all duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] ${
              isFocused ? 'bg-white/60 scale-[1.01]' : 'bg-white/40 hover:bg-white/50'
            }`}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={t.placeholder}
                className="w-full h-24 sm:h-32 bg-transparent p-6 text-base sm:text-xl text-[#4a5d23] placeholder:text-[#4a5d23]/50 focus:outline-none resize-none font-medium leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-center min-h-[80px] sm:min-h-[100px] px-1">
              {displayedSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-[12px] font-bold transition-all hover:scale-105 active:scale-95 ${s.color.replace('bg-', 'bg-opacity-80 bg-')} shadow-sm hover:shadow-md animate-[popIn_0.4s_ease-out] backdrop-blur-sm`}
                >
                  {s.text}
                </button>
              ))}
            </div>

            <div className="space-y-3 sm:space-y-4">
              <label className="text-[10px] font-black text-[#4a5d23] uppercase tracking-[0.2em] block opacity-80 drop-shadow-sm">
                {t.storyLength}
              </label>
              <div className="bg-white/30 backdrop-blur-md p-1.5 rounded-[1.5rem] sm:rounded-[2rem] flex justify-between gap-1.5 shadow-sm">
                {pageOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPageCount(opt)}
                    className={`flex-1 py-2 sm:py-3 px-1.5 rounded-[1.3rem] sm:rounded-[1.8rem] font-black transition-all duration-300 flex flex-col items-center justify-center gap-0.5 ${
                      pageCount === opt
                        ? 'bg-white/80 backdrop-blur-sm text-[#4a5d23] shadow-md scale-105'
                        : 'text-[#4a5d23]/70 hover:text-[#4a5d23] hover:bg-white/20'
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
              className="w-full bg-gradient-to-br from-[#9bbf6b] to-[#749e47] text-white font-magic text-xl sm:text-2xl py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale disabled:scale-100 shadow-lg hover:shadow-xl mt-2 uppercase tracking-widest font-bold backdrop-blur-sm"
            >
              {t.createButton}
            </button>
          </form>
        </div>
      </div>

      {/* Bookshelf Section */}
      {savedStories.length > 0 && (
        <div className="w-full space-y-6 sm:space-y-8">
          <div className="flex flex-col items-center gap-1.5 px-4">
            <h3 className="text-2xl sm:text-4xl font-magic text-[#4a5d23] drop-shadow-sm tracking-tight">{t.bookshelfTitle}</h3>
            <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-[#749e47] to-transparent opacity-30" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {savedStories.map((story) => (
              <div 
                key={story.id} 
                className="group bg-white/40 backdrop-blur-md rounded-[2rem] hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col p-3 relative hover:-translate-y-1 border border-white/30"
              >
                <div className="aspect-square bg-white/50 rounded-[1.5rem] overflow-hidden mb-3 border border-white/40 shadow-inner">
                  {story.pages[0]?.imageUrl && (
                    <img src={story.pages[0].imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  )}
                </div>
                <div className="flex-1 min-h-[3.5rem] px-1">
                  <h4 className="font-magic text-[#4a5d23] text-lg sm:text-xl line-clamp-2 mb-0.5 leading-tight tracking-tight">{story.title || 'Untitled'}</h4>
                  <p className="text-[10px] text-[#4a5d23]/70 font-black uppercase tracking-widest opacity-80">{story.pages.length} {t.pages}</p>
                </div>
                
                <div className="flex gap-2 mt-3 pt-3 border-t border-white/30">
                  <button 
                    onClick={() => onLoadStory(story)}
                    className="flex-1 bg-[#749e47]/90 hover:bg-[#749e47] text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm backdrop-blur-sm"
                  >
                    {t.loadStory}
                  </button>
                  <button 
                    onClick={() => onDeleteStory(story.id!)}
                    className="bg-rose-50/80 text-rose-500 p-2 rounded-xl hover:bg-rose-100 transition-all border border-rose-100/50 active:scale-95 shadow-sm backdrop-blur-sm"
                    aria-label={t.deleteStory}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
