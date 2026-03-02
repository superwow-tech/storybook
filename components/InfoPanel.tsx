
import React, { useState } from 'react';
import { translations } from '../translations';
import { Language, Theme } from '../types';

interface Props {
  onClose: () => void;
  language: Language;
  theme: Theme;
}

const InfoPanel: React.FC<Props> = ({ onClose, language, theme }) => {
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  const t = translations[language];
  const isDark = theme === 'dark';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setFeedback('');
    }, 3000);
  };

  return (
    <div className={`fixed inset-0 z-[100] md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[650px] flex flex-col backdrop-blur-xl md:rounded-[2.5rem] overflow-hidden animate-[popIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)] border ${isDark ? 'bg-[#23214A]/80 border-[#6B7FD7]/30' : 'bg-white/80 border-[#E0E7FF]/60'}`}>
      <header className="bg-transparent p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${isDark ? 'bg-[#312E81]/50 text-[#F5E6CA]' : 'bg-[#DBEAFE] text-[#3B82F6]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className={`font-magic text-2xl leading-tight tracking-wide ${isDark ? 'text-[#F5E6CA]' : 'text-[#1E3A8A]'}`}>{t.infoTitle}</h4>
        </div>
        <button onClick={onClose} className={`p-2.5 rounded-2xl transition-colors ${isDark ? 'bg-white/5 hover:bg-white/10 text-[#F5E6CA]' : 'bg-black/5 hover:bg-black/10 text-[#1E3A8A]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-transparent">
        <section className="space-y-3">
          <h5 className={`font-magic text-2xl tracking-wide ${isDark ? 'text-[#F5E6CA]' : 'text-[#1E3A8A]'}`}>{t.howItWorksTitle}</h5>
          <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-[#A39BA8]' : 'text-[#475569]'}`}>
            {t.howItWorksDesc}
          </p>
        </section>

        <section className="space-y-3">
          <h5 className={`font-magic text-2xl tracking-wide ${isDark ? 'text-[#F5E6CA]' : 'text-[#1E3A8A]'}`}>{t.instructionsTitle}</h5>
          <ul className={`text-sm space-y-2 font-medium ${isDark ? 'text-[#A39BA8]' : 'text-[#475569]'}`}>
            <li className="flex gap-2">
              <span className={`font-bold ${isDark ? 'text-[#F4D35E]' : 'text-[#3B82F6]'}`}>1.</span>
              {t.instruction1}
            </li>
            <li className="flex gap-2">
              <span className={`font-bold ${isDark ? 'text-[#F4D35E]' : 'text-[#3B82F6]'}`}>2.</span>
              {t.instruction2}
            </li>
            <li className="flex gap-2">
              <span className={`font-bold ${isDark ? 'text-[#F4D35E]' : 'text-[#3B82F6]'}`}>3.</span>
              {t.instruction3}
            </li>
            <li className="flex gap-2">
              <span className={`font-bold ${isDark ? 'text-[#F4D35E]' : 'text-[#3B82F6]'}`}>4.</span>
              {t.instruction4}
            </li>
          </ul>
        </section>

        <section className={`space-y-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
          <div className="space-y-1">
            <h5 className={`font-magic text-2xl tracking-wide ${isDark ? 'text-[#F5E6CA]' : 'text-[#1E3A8A]'}`}>{t.feedbackTitle}</h5>
            <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#A39BA8]' : 'text-[#64748B]'}`}>{t.feedbackSub}</p>
          </div>
          
          <form onSubmit={handleSend} className="space-y-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t.feedbackPlaceholder}
              className={`w-full h-32 backdrop-blur-sm rounded-2xl p-4 text-sm font-medium resize-none focus:outline-none transition-all border-none shadow-none ${isDark ? 'bg-[#23214A]/40 text-[#F5E6CA] placeholder:text-[#A39BA8]/50 focus:bg-[#23214A]/60' : 'bg-white/40 text-[#1E3A8A] placeholder:text-[#64748B]/50 focus:bg-white/60'}`}
            />
            <button 
              type="submit"
              disabled={sent || !feedback.trim()}
              className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                sent 
                  ? 'bg-green-500 text-white' 
                  : (isDark ? 'bg-[#F4D35E] hover:bg-[#D4AF37] text-[#0B1026]' : 'bg-[#3B82F6] hover:bg-[#2563EB] text-white')
              }`}
            >
              {sent ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>{t.thankYou}</span>
                </>
              ) : (
                <span>{t.sendButton}</span>
              )}
            </button>
          </form>
        </section>
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default InfoPanel;
