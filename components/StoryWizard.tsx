
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
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-green-50 text-green-700 border-green-100",
  "bg-yellow-50 text-yellow-700 border-yellow-100",
  "bg-pink-50 text-pink-700 border-pink-100",
  "bg-purple-50 text-purple-700 border-purple-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100"
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
    <div className="w-full max-w-4xl space-y-12 animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] py-2 sm:py-6">
      <div className="max-w-xl mx-auto bg-white/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-12 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] border border-white relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-200/10 blur-[60px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-200/10 blur-[60px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl md:text-4xl font-magic mb-1 md:mb-2 magic-color-title">
            {t.wizardTitle}
          </h2>
          <p className="text-indigo-400 font-bold mb-4 sm:mb-8 text-[10px] sm:text-base tracking-wide uppercase">
            {t.wizardSub}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
            <div className={`group relative transition-all duration-500 rounded-[1.5rem] sm:rounded-[2.5rem] p-1 ${
              isFocused ? 'bg-gradient-to-br from-indigo-400 to-purple-400 shadow-md scale-[1.01]' : 'bg-indigo-100/50 hover:bg-indigo-100'
            }`}>
              <div className="bg-white rounded-[1.3rem] sm:rounded-[2.3rem] overflow-hidden">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={t.placeholder}
                  className="w-full h-24 sm:h-40 bg-transparent p-4 sm:p-6 text-base sm:text-xl text-indigo-950 placeholder:text-indigo-200 focus:outline-none resize-none font-medium leading-relaxed"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center min-h-[80px] sm:min-h-[100px]">
              {displayedSuggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold transition-all hover:scale-105 active:scale-95 border border-transparent ${s.color} hover:shadow-sm animate-[popIn_0.4s_ease-out]`}
                >
                  {s.text}
                </button>
              ))}
            </div>

            <div className="space-y-2 sm:space-y-4">
              <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] block">
                {t.storyLength}
              </label>
              <div className="bg-indigo-50/50 p-1.5 rounded-[1.5rem] sm:rounded-[2rem] flex justify-between gap-1 sm:gap-2 border border-indigo-100/50">
                {pageOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setPageCount(opt)}
                    className={`flex-1 py-2 sm:py-3 px-1 rounded-[1.2rem] sm:rounded-[1.5rem] text-[10px] sm:text-sm font-black transition-all duration-300 ${
                      pageCount === opt
                        ? 'bg-white text-indigo-700 border border-indigo-100 scale-105 ring-1 ring-indigo-50'
                        : 'text-indigo-300 hover:text-indigo-500 hover:bg-white/40'
                    }`}
                  >
                    {opt} <span className="text-[8px] sm:text-[10px] opacity-60">{t.pages}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              disabled={!prompt.trim()}
              className={`w-full relative group py-3.5 sm:py-5 rounded-[1.5rem] sm:rounded-[2.5rem] text-lg sm:text-xl font-magic transition-all overflow-hidden ${
                prompt.trim() 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-lg shadow-indigo-100' 
                  : 'bg-indigo-50 text-indigo-200 pointer-events-none'
              }`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                {prompt.trim() && <span className="animate-pulse">✨</span>}
                {t.createButton}
                {prompt.trim() && <span className="animate-pulse">✨</span>}
              </span>
              {prompt.trim() && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Bookshelf Section */}
      {savedStories.length > 0 && (
        <div className="w-full space-y-6">
          <div className="flex items-center gap-4 px-4">
            <h3 className="text-xl md:text-2xl font-magic text-indigo-900">{t.bookshelfTitle}</h3>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-indigo-100 to-transparent" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
            {savedStories.map((story) => (
              <div 
                key={story.id} 
                className="group bg-white rounded-[2rem] shadow-md hover:shadow-xl transition-all border border-indigo-50/50 overflow-hidden flex flex-col p-3 relative"
              >
                <div className="aspect-square bg-indigo-50 rounded-[1.5rem] overflow-hidden mb-3">
                  {story.pages[0]?.imageUrl && (
                    <img src={story.pages[0].imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  )}
                </div>
                <div className="flex-1 min-h-[4rem]">
                  <h4 className="font-magic text-indigo-800 text-sm line-clamp-2 mb-1">{story.title || 'Untitled'}</h4>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase">{story.pages.length} {t.pages}</p>
                </div>
                
                <div className="flex gap-2 mt-2 pt-2 border-t border-indigo-50">
                  <button 
                    onClick={() => onLoadStory(story)}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-colors"
                  >
                    {t.loadStory}
                  </button>
                  <button 
                    onClick={() => onDeleteStory(story.id!)}
                    className="bg-red-50 text-red-400 p-2 rounded-xl hover:bg-red-100 transition-colors"
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
