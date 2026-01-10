
import React, { useState, useEffect, useRef } from 'react';
import { Story, Language } from '../types';
import { translations } from '../translations';
import { decodeBase64, decodeAudioData } from '../geminiService';

interface Props {
  story: Story;
  currentIndex: number;
  onPageChange: (index: number) => void;
  onReset?: () => void;
  language: Language;
}

const StoryReader: React.FC<Props> = ({ story, currentIndex, onPageChange, onReset, language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const t = translations[language];
  const totalPages = story.pages.length;
  const isLastPage = currentIndex === totalPages - 1;
  const currentPage = story.pages[currentIndex];

  const handleNext = () => {
    if (currentIndex < totalPages - 1) onPageChange(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) onPageChange(currentIndex - 1);
  };

  // Touch handling for swipe
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 60) handleNext();
    else if (diff < -60) handlePrev();
    touchStartX.current = null;
  };

  const playAudio = async () => {
    if (!currentPage?.audioData || isPlaying) return;
    
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch(e) {}
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    try {
      setIsPlaying(true);
      const data = decodeBase64(currentPage.audioData);
      const buffer = await decodeAudioData(data, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      currentSourceRef.current = source;
    } catch (err) {
      console.error("Audio playback error", err);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    setIsPlaying(false);
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch(e) {}
    }
  }, [currentIndex]);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-start sm:justify-center py-6 md:py-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-[450px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.15)] overflow-hidden flex flex-col border border-indigo-50 relative">
        
        {/* Top Image Section */}
        <div className="w-full aspect-[4/3] sm:aspect-square bg-indigo-50 relative overflow-hidden">
          {currentPage?.imageUrl ? (
            <img 
              key={currentPage.imageUrl}
              src={currentPage.imageUrl} 
              alt="Puslapio iliustracija" 
              className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-6 text-indigo-300">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="font-magic text-center text-sm">{t.painting}</p>
            </div>
          )}
          
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 shadow-sm border border-white/50">
            {currentIndex + 1} / {totalPages}
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col gap-4 sm:gap-6">
          <div className="space-y-4">
            <div className="min-h-[100px] sm:min-h-[140px]">
              <p className="text-lg sm:text-2xl font-semibold leading-relaxed text-indigo-900/90">
                {currentPage?.text || "..."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={playAudio}
              disabled={!currentPage?.audioData || isPlaying}
              className={`w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 rounded-[1.5rem] font-bold transition-all shadow-lg active:scale-95 ${
                isPlaying 
                  ? 'bg-indigo-50 text-indigo-400' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
              }`}
            >
              {isPlaying ? (
                <>
                  <div className="flex gap-1 items-end h-3.5">
                    <div className="w-1.5 bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_0s]" />
                    <div className="w-1.5 bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_0.1s]" />
                    <div className="w-1.5 bg-indigo-400 rounded-full animate-[bounce_0.6s_infinite_0.2s]" />
                  </div>
                  <span className="text-sm sm:text-base">{t.reading}</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm sm:text-base">{t.readToMe}</span>
                </>
              )}
            </button>

            {isLastPage && (
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[1.2rem] font-magic text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 animate-[bounceIn_0.5s_ease-out]"
              >
                <span>✨</span>
                <span>{t.oneMore}</span>
                <span>✨</span>
              </button>
            )}
          </div>

          <div className="flex justify-between items-center px-1">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`text-[9px] font-bold tracking-widest transition-opacity px-2 py-1 ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-indigo-400 hover:text-indigo-600'}`}
            >
              {t.previous}
            </button>
            
            <div className="flex gap-2">
              {story.pages.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-indigo-600 scale-125' : 'bg-indigo-100'}`} 
                />
              ))}
            </div>

            <button 
              onClick={handleNext} 
              disabled={isLastPage}
              className={`text-[9px] font-bold tracking-widest transition-opacity px-2 py-1 ${isLastPage ? 'opacity-0 pointer-events-none' : 'text-indigo-400 hover:text-indigo-600'}`}
            >
              {t.next}
            </button>
          </div>
        </div>
      </div>
      
      <p className="hidden md:block text-[10px] font-bold text-indigo-300 uppercase tracking-widest mt-4">
        {t.desktopHint}
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.02); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default StoryReader;
