
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
  onSave?: () => void;
  isSaved?: boolean;
}

const StoryReader: React.FC<Props> = ({ story, currentIndex, onPageChange, onReset, language, onSave, isSaved }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const t = translations[language];
  const totalPages = story.pages.length;
  const isLastPage = currentIndex === totalPages - 1;
  const currentPage = story.pages[currentIndex];

  const words = currentPage?.text ? currentPage.text.split(/\s+/) : [];

  const handleNext = () => {
    if (currentIndex < totalPages - 1) onPageChange(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) onPageChange(currentIndex - 1);
  };

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

  const stopAudio = () => {
    isPlayingRef.current = false;
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.onended = null;
      } catch (e) {}
      currentSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setHighlightIndex(-1);
  };

  const playAudio = async () => {
    if (!currentPage?.audioData || isPlaying) return;
    
    stopAudio();

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    try {
      const data = decodeBase64(currentPage.audioData);
      const buffer = await decodeAudioData(data, ctx, 24000, 1);
      const duration = buffer.duration;
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        stopAudio();
      };

      startTimeRef.current = ctx.currentTime;
      isPlayingRef.current = true;
      setIsPlaying(true);
      source.start();
      currentSourceRef.current = source;

      const updateHighlight = () => {
        if (!isPlayingRef.current) return;
        const elapsed = ctx.currentTime - startTimeRef.current;
        const progress = elapsed / duration;
        const wordIndex = Math.floor(progress * words.length);
        if (wordIndex >= 0 && wordIndex < words.length) {
          setHighlightIndex(wordIndex);
        } else if (wordIndex >= words.length) {
          setHighlightIndex(-1);
        }
        animationFrameRef.current = requestAnimationFrame(updateHighlight);
      };
      animationFrameRef.current = requestAnimationFrame(updateHighlight);
    } catch (err) {
      console.error("Audio playback error", err);
      stopAudio();
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);
    }
  };

  useEffect(() => {
    stopAudio();
  }, [currentIndex]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-start py-4 md:py-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-[550px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.12)] overflow-hidden flex flex-col border border-indigo-50/50 relative">
        
        <div className="w-full aspect-[4/3] bg-indigo-50 relative overflow-hidden group">
          {currentPage?.imageUrl ? (
            <img 
              key={currentPage.imageUrl}
              src={currentPage.imageUrl} 
              alt="Story illustration" 
              className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out] transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-indigo-300">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xs">✨</div>
              </div>
              <p className="font-magic text-center text-sm animate-pulse">{t.painting}</p>
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            {!isSaved && (
              <button 
                onClick={handleSave}
                className="bg-white/90 backdrop-blur-md p-2 rounded-full text-indigo-600 shadow-sm border border-white/50 hover:bg-white transition-all active:scale-95"
                title={t.saveToBookshelf}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-indigo-600 shadow-sm border border-white/50 flex items-center">
              {currentIndex + 1} / {totalPages}
            </div>
          </div>

          {showSaveSuccess && (
            <div className="absolute top-14 right-4 bg-green-500 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-lg animate-[bounceIn_0.4s_ease-out]">
              {t.storySaved}
            </div>
          )}
        </div>

        <div className="flex-1 p-6 sm:p-8 flex flex-col gap-5">
          <div className="space-y-4">
            <div className="min-h-[160px] sm:min-h-[220px] bg-indigo-50/20 p-5 rounded-[2rem] border border-indigo-50/30 overflow-y-auto scrollbar-hide">
              <p className="text-lg sm:text-xl font-medium leading-relaxed transition-all">
                {words.map((word, idx) => {
                  const isActive = idx === highlightIndex;
                  return (
                    <span 
                      key={idx}
                      className={`inline-block mr-1.5 transition-all duration-200 rounded-md px-1 py-0.5 ${
                        isActive 
                          ? 'bg-yellow-200 text-indigo-950 scale-110 shadow-sm font-bold -translate-y-0.5' 
                          : 'text-indigo-900/90'
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
                {!currentPage?.text && <span className="animate-pulse">...</span>}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={playAudio}
              disabled={!currentPage?.audioData || isPlaying}
              className={`w-full flex items-center justify-center gap-3 py-4 sm:py-5 rounded-[1.8rem] font-bold transition-all shadow-lg active:scale-95 ${
                isPlaying 
                  ? 'bg-indigo-50 text-indigo-400 border border-indigo-100' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              }`}
            >
              {isPlaying ? (
                <>
                  <div className="flex gap-1.5 items-end h-4">
                    <div className="w-2 bg-indigo-400 rounded-full animate-[soundWave_0.6s_infinite_0s]" />
                    <div className="w-2 bg-indigo-400 rounded-full animate-[soundWave_0.6s_infinite_0.1s]" />
                    <div className="w-2 bg-indigo-400 rounded-full animate-[soundWave_0.6s_infinite_0.2s]" />
                  </div>
                  <span className="text-sm sm:text-lg font-magic">{t.reading}</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm sm:text-lg font-magic tracking-wide">{t.readToMe}</span>
                </>
              )}
            </button>

            {isLastPage && (
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-[1.5rem] font-magic text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all border border-indigo-100 animate-[bounceIn_0.5s_ease-out]"
              >
                <span className="text-xl">✨</span>
                <span>{t.oneMore}</span>
                <span className="text-xl">✨</span>
              </button>
            )}
          </div>

          <div className="flex justify-between items-center px-2">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`flex items-center gap-1 text-[10px] font-black tracking-widest transition-all px-3 py-2 rounded-xl ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <span>{t.previous}</span>
            </button>
            
            <div className="flex gap-2.5">
              {story.pages.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-indigo-600 w-4 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-indigo-100 w-1.5'}`} 
                />
              ))}
            </div>

            <button 
              onClick={handleNext} 
              disabled={isLastPage}
              className={`flex items-center gap-1 text-[10px] font-black tracking-widest transition-all px-3 py-2 rounded-xl ${isLastPage ? 'opacity-0 pointer-events-none' : 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            >
              <span>{t.next}</span>
            </button>
          </div>
        </div>
      </div>
      
      <p className="hidden md:block text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] mt-6 animate-pulse">
        {t.desktopHint}
      </p>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(1.05); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes soundWave {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
      `}</style>
    </div>
  );
};

export default StoryReader;
