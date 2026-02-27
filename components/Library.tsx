
import React from 'react';
import { translations } from '../translations';
import { Language, Story } from '../types';

interface Props {
  stories: Story[];
  onLoadStory: (story: Story) => void;
  onDeleteStory: (id: string) => void;
  language: Language;
  onClose: () => void;
}

const Library: React.FC<Props> = ({ stories, onLoadStory, onDeleteStory, language, onClose }) => {
  const t = translations[language];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="relative flex flex-col items-center justify-center pt-2 sm:pt-0">
        <button 
          onClick={onClose}
          className="absolute left-0 top-2 sm:top-1/2 sm:-translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-[#2B3A67]/50 hover:bg-[#2B3A67]/80 rounded-full flex items-center justify-center text-[#F5E6CA] transition-all active:scale-90 z-10 border border-[#6B7FD7]/30"
          aria-label={t.back}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex flex-col items-center gap-2 pt-12 sm:pt-0 w-full">
          <h2 className="text-3xl sm:text-6xl font-magic text-[#F5E6CA] tracking-tight text-center leading-tight px-8 drop-shadow-lg">
            {t.bookshelfTitle}
          </h2>
          <p className="text-[#A39BA8] font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs drop-shadow-sm">
            {stories.length} {stories.length === 1 ? 'STORY' : 'STORIES'} SAVED
          </p>
        </div>
      </div>

      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center space-y-6 min-h-[50vh]">
          <div className="text-6xl sm:text-7xl opacity-20 animate-bounce grayscale brightness-200">📚</div>
          <div className="space-y-2 max-w-xs mx-auto">
            <p className="text-[#F5E6CA] font-magic text-2xl">
              {t.emptyLibraryTitle || "It's quiet here..."}
            </p>
            <p className="text-[#A39BA8] font-medium text-sm sm:text-base">
              {t.noStories}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="bg-gradient-to-br from-[#F4D35E] to-[#D4AF37] text-[#0B1026] px-8 py-3 sm:px-10 sm:py-4 rounded-2xl font-bold shadow-[0_0_20px_rgba(244,211,94,0.3)] hover:shadow-[0_0_30px_rgba(244,211,94,0.5)] transition-all active:scale-95 flex items-center gap-2 group mt-4 uppercase tracking-widest"
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
              className="group bg-[#0B1026]/60 backdrop-blur-md rounded-[2.5rem] hover:shadow-[0_0_30px_rgba(107,127,215,0.2)] transition-all duration-500 overflow-hidden flex flex-col p-4 relative hover:-translate-y-2 border border-[#6B7FD7]/20 cursor-pointer"
            >
              <div className="aspect-[4/3] bg-[#1e1b4b]/50 rounded-[2rem] overflow-hidden mb-4 border border-[#6B7FD7]/20 shadow-inner relative">
                {story.pages[0]?.imageUrl && (
                  <img 
                    src={story.pages[0].imageUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                )}
                <div className="absolute top-3 right-3 bg-[#0B1026]/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-[#F4D35E] shadow-sm border border-[#6B7FD7]/30">
                  {story.pages.length} {t.pages}
                </div>
              </div>
              
              <div className="flex-1 px-2 space-y-1">
                <h4 className="font-magic text-[#F5E6CA] text-2xl line-clamp-2 leading-tight tracking-tight drop-shadow-sm">
                  {story.title || 'Untitled'}
                </h4>
                <p className="text-[10px] text-[#A39BA8] font-black uppercase tracking-widest opacity-70">
                  {story.timestamp ? new Date(story.timestamp).toLocaleDateString(language === 'lt' ? 'lt-LT' : 'en-US') : ''}
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <div className="flex-1 bg-gradient-to-br from-[#F4D35E] to-[#D4AF37] text-[#0B1026] py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg text-center hover:brightness-110">
                  {t.loadStory}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteStory(story.id!);
                  }}
                  className="bg-rose-900/40 text-rose-300 p-3 rounded-2xl hover:bg-rose-900/60 transition-all border border-rose-500/20 active:scale-95 shadow-sm relative z-10"
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
