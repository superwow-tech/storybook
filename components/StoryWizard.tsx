
import React, { useState, useEffect } from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface Props {
  onGenerate: (prompt: string, pageCount: number) => void;
  language: Language;
}

const StoryWizard: React.FC<Props> = ({ onGenerate, language }) => {
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [pageCount, setPageCount] = useState(5);

  const t = translations[language];

  // Clear input field when language changes
  useEffect(() => {
    setPrompt('');
  }, [language]);

  const suggestions = [
    { text: t.suggestions[0], color: "bg-blue-50 text-blue-700 border-blue-100" },
    { text: t.suggestions[1], color: "bg-green-50 text-green-700 border-green-100" },
    { text: t.suggestions[2], color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    { text: t.suggestions[3], color: "bg-pink-50 text-pink-700 border-pink-100" }
  ];

  const pageOptions = [3, 5, 7, 10];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt, pageCount);
    }
  };

  return (
    <div className="w-full max-w-xl animate-[slideUp_0.5s_cubic-bezier(0.16,1,0.3,1)] py-2 sm:py-6">
      <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-12 shadow-[0_32px_64px_-16px_rgba(79,70,229,0.15)] border border-white relative overflow-hidden">
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

            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-[12px] font-bold transition-all hover:scale-105 active:scale-95 border border-transparent ${s.color} hover:shadow-sm`}
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

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default StoryWizard;
