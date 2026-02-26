
import React, { useState } from 'react';
import { translations } from '../translations';
import { Language } from '../types';

interface Props {
  onClose: () => void;
  language: Language;
}

const InfoPanel: React.FC<Props> = ({ onClose, language }) => {
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  const t = translations[language];

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
    <div className="fixed inset-0 z-[100] md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[650px] flex flex-col bg-white/60 backdrop-blur-xl md:rounded-[2.5rem] overflow-hidden animate-[popIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
      <header className="bg-transparent p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-[#749e47]/10 rounded-2xl flex items-center justify-center text-[#749e47]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-[#4a5d23] font-magic text-2xl leading-tight tracking-wide">{t.infoTitle}</h4>
        </div>
        <button onClick={onClose} className="bg-black/5 hover:bg-black/10 p-2.5 rounded-2xl transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4a5d23]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide bg-transparent">
        <section className="space-y-3">
          <h5 className="text-[#4a5d23] font-magic text-2xl tracking-wide">{t.howItWorksTitle}</h5>
          <p className="text-sm text-[#4a5d23]/80 leading-relaxed font-medium">
            {t.howItWorksDesc}
          </p>
        </section>

        <section className="space-y-3">
          <h5 className="text-[#4a5d23] font-magic text-2xl tracking-wide">{t.instructionsTitle}</h5>
          <ul className="text-sm text-[#4a5d23]/80 space-y-2 font-medium">
            <li className="flex gap-2">
              <span className="text-[#749e47] font-bold">1.</span>
              {t.instruction1}
            </li>
            <li className="flex gap-2">
              <span className="text-[#749e47] font-bold">2.</span>
              {t.instruction2}
            </li>
            <li className="flex gap-2">
              <span className="text-[#749e47] font-bold">3.</span>
              {t.instruction3}
            </li>
            <li className="flex gap-2">
              <span className="text-[#749e47] font-bold">4.</span>
              {t.instruction4}
            </li>
          </ul>
        </section>

        <section className="space-y-4 pt-4 border-t border-white/30">
          <div className="space-y-1">
            <h5 className="text-[#4a5d23] font-magic text-2xl tracking-wide">{t.feedbackTitle}</h5>
            <p className="text-xs text-[#4a5d23]/60 font-bold uppercase tracking-wider">{t.feedbackSub}</p>
          </div>
          
          <form onSubmit={handleSend} className="space-y-4">
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t.feedbackPlaceholder}
              className="w-full h-32 bg-white/40 backdrop-blur-sm rounded-2xl p-4 text-sm font-medium resize-none text-[#4a5d23] placeholder:text-[#4a5d23]/40 focus:outline-none focus:bg-white/60 transition-all border-none shadow-none"
            />
            <button 
              type="submit"
              disabled={sent || !feedback.trim()}
              className={`w-full py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                sent 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#749e47] hover:bg-[#5b8e4d] text-white'
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
