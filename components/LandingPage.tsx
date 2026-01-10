
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center transform hover:scale-[1.01] transition-all">
        <div className="text-7xl mb-6">✨📖✨</div>
        <h1 className="text-4xl font-magic text-indigo-700 mb-4">Magic Dziulis</h1>
        <p className="text-gray-600 mb-8 font-medium leading-relaxed">
          {t.tagline}
        </p>
        
        <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
          <p className="text-sm text-indigo-800 font-bold mb-2 flex items-center gap-2">
            <span className="text-xl">💡</span> {language === 'lt' ? 'Prieš pradedant:' : 'Before you start:'}
          </p>
          <p className="text-sm text-indigo-600/80 leading-relaxed">
            {t.billingNotice}
          </p>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-3 text-xs font-bold text-indigo-500 hover:text-indigo-700 underline"
          >
            {t.billingLink}
          </a>
        </div>

        <button
          onClick={onStart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all hover:shadow-indigo-200 active:scale-95"
        >
          {t.startButton}
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
