
import React from 'react';
import { translations } from '../translations';
import { Language, Story, Theme } from '../types';

interface Props {
  stories: Story[];
  onLoadStory: (story: Story) => void;
  onDeleteStory: (id: string) => void;
  language: Language;
  onClose: () => void;
  theme: Theme;
}

const Library: React.FC<Props> = ({ stories, onLoadStory, onDeleteStory, language, onClose, theme }) => {
  const t = translations[language];
  const isDark = theme === 'dark';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center justify-between mb-8 sm:mb-12">
        <button 
          onClick={onClose}
          className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-90 z-10 ${isDark ? 'bg-[#1E1B4B]/50 hover:bg-[#1E1B4B]/80 text-[#FEF3C7]' : 'bg-white/50 hover:bg-white/80 text-[#166534]'}`}
          aria-label={t.back}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center flex-1 px-2">
          <h2 className={`text-2xl sm:text-5xl font-magic tracking-tight text-center leading-tight drop-shadow-lg ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>
            {t.bookshelfTitle}
          </h2>
          <p className={`font-bold uppercase tracking-[0.2em] text-[9px] sm:text-xs drop-shadow-sm mt-1 sm:mt-2 ${isDark ? 'text-[#FCD34D]' : 'text-[#15803D]'}`}>
            {stories.length} {stories.length === 1 ? 'STORY' : 'STORIES'} SAVED
          </p>
        </div>

        <div className="w-10 sm:w-12 shrink-0"></div>
      </div>

      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center space-y-6 min-h-[50vh]">
          <div className="text-6xl sm:text-7xl opacity-20 animate-bounce grayscale brightness-200">📚</div>
          <div className="space-y-2 max-w-xs mx-auto">
            <p className={`font-magic text-2xl ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>
              {t.emptyLibraryTitle || "It's quiet here..."}
            </p>
            <p className={`font-medium text-sm sm:text-base ${isDark ? 'text-[#D1D5DB]' : 'text-[#475569]'}`}>
              {t.noStories}
            </p>
          </div>
          <button 
            onClick={onClose}
            className={`px-8 py-3 sm:px-10 sm:py-4 rounded-2xl font-bold transition-all active:scale-95 flex items-center gap-2 group mt-4 uppercase tracking-widest ${isDark ? 'bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] text-[#451A03] shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'}`}
          >
            <span className="text-xl group-hover:rotate-12 transition-transform">✨</span>
            <span>{t.createButton}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div 
              key={story.id} 
              onClick={() => onLoadStory(story)}
              className={`group backdrop-blur-md rounded-[2.5rem] transition-all duration-500 overflow-hidden flex flex-col p-4 relative hover:-translate-y-2 cursor-pointer ${isDark ? 'bg-[#23214A]/80 hover:shadow-[0_0_30px_rgba(76,29,149,0.2)]' : 'bg-white/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]'}`}
            >
              <div className={`aspect-[4/3] rounded-[2rem] overflow-hidden mb-4 shadow-inner relative ${isDark ? 'bg-[#312E81]/40' : 'bg-white/50'}`}>
                {story.pages[0]?.imageUrl && (
                  <img 
                    src={story.pages[0].imageUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                )}
                <div className={`absolute top-3 right-3 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black shadow-sm ${isDark ? 'bg-[#23214A]/90 text-[#FCD34D]' : 'bg-white/80 text-[#3B82F6]'}`}>
                  {story.pages.length} {t.pages}
                </div>
              </div>
              
              <div className="flex-1 px-2 space-y-1">
                <h4 className={`font-magic text-2xl line-clamp-2 leading-tight tracking-tight drop-shadow-sm ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>
                  {story.title || 'Untitled'}
                </h4>
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-70 ${isDark ? 'text-[#D1D5DB]' : 'text-[#15803D]'}`}>
                  {story.timestamp ? new Date(story.timestamp).toLocaleDateString(language === 'lt' ? 'lt-LT' : 'en-US') : ''}
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <div className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg text-center hover:brightness-110 ${isDark ? 'bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] text-[#451A03]' : 'bg-gradient-to-br from-[#60A5FA] to-[#3B82F6] text-white'}`}>
                  {t.loadStory}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStory(story.id!);
                  }}
                  className={`p-3 rounded-2xl transition-all active:scale-95 shadow-sm relative z-10 ${isDark ? 'bg-rose-900/40 text-rose-300 hover:bg-rose-900/60' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
                  aria-label={t.deleteStory}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Library;
