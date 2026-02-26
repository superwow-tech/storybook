
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
    <div className="w-full max-w-5xl mx-auto px-4 py-8 space-y-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/40 hover:bg-white/60 rounded-full flex items-center justify-center text-[#4a5d23] transition-all active:scale-90"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-4xl sm:text-6xl font-magic text-[#4a5d23] tracking-tight">{t.bookshelfTitle}</h2>
        </div>
        <p className="text-[#4a5d23]/60 font-bold uppercase tracking-[0.2em] text-xs">
          {stories.length} {stories.length === 1 ? 'STORY' : 'STORIES'} SAVED
        </p>
      </div>

      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="text-6xl opacity-20">📚</div>
          <p className="text-[#4a5d23]/60 font-medium text-lg max-w-xs mx-auto">
            {t.noStories}
          </p>
          <button 
            onClick={onClose}
            className="bg-[#749e47] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            {t.createButton}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <div 
              key={story.id} 
              className="group bg-white/40 backdrop-blur-md rounded-[2.5rem] hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col p-4 relative hover:-translate-y-2 border border-white/30"
            >
              <div className="aspect-[4/3] bg-white/50 rounded-[2rem] overflow-hidden mb-4 border border-white/40 shadow-inner relative">
                {story.pages[0]?.imageUrl && (
                  <img 
                    src={story.pages[0].imageUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                )}
                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black text-[#4a5d23] shadow-sm">
                  {story.pages.length} {t.pages}
                </div>
              </div>
              
              <div className="flex-1 px-2 space-y-1">
                <h4 className="font-magic text-[#4a5d23] text-2xl line-clamp-2 leading-tight tracking-tight">
                  {story.title || 'Untitled'}
                </h4>
                <p className="text-[10px] text-[#4a5d23]/50 font-black uppercase tracking-widest">
                  {story.timestamp ? new Date(story.timestamp).toLocaleDateString(language === 'lt' ? 'lt-LT' : 'en-US') : ''}
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => onLoadStory(story)}
                  className="flex-1 bg-gradient-to-br from-[#9bbf6b] to-[#749e47] text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg"
                >
                  {t.loadStory}
                </button>
                <button 
                  onClick={() => onDeleteStory(story.id!)}
                  className="bg-rose-50/80 text-rose-500 p-3 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100/50 active:scale-95 shadow-sm"
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
