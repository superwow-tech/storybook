
import React, { useState, useEffect, useRef } from 'react';
import { Story, Language, Theme } from '../types';
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
  theme: Theme;
}

const StoryReader: React.FC<Props> = ({ story, currentIndex, onPageChange, onReset, language, onSave, isSaved, theme }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [hasReadCurrentPage, setHasReadCurrentPage] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  const t = translations[language];
  const totalPages = story.pages.length;
  const isLastPage = currentIndex === totalPages - 1;
  const currentPage = story.pages[currentIndex];
  const isDark = theme === 'dark';

  const words = currentPage?.text ? currentPage.text.trim().split(/\s+/) : [];

  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right');
  const [swipeOffset, setSwipeOffset] = useState(0);

  const handleNext = () => {
    if (currentIndex < totalPages - 1) {
      if (navigator.vibrate) navigator.vibrate(30);
      setSlideDir('right');
      onPageChange(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      if (navigator.vibrate) navigator.vibrate(30);
      setSlideDir('left');
      onPageChange(currentIndex - 1);
    }
  };

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    touchCurrentX.current = e.touches[0].clientX;
    const diff = touchCurrentX.current - touchStartX.current;
    // Limit visual offset to prevent dragging too far off screen
    setSwipeOffset(Math.max(-100, Math.min(100, diff)));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchCurrentX.current) {
      setSwipeOffset(0);
      return;
    }
    const diff = touchStartX.current - touchCurrentX.current;
    
    if (diff > 60) {
      handleNext();
    } else if (diff < -60) {
      handlePrev();
    }
    
    setSwipeOffset(0);
    touchStartX.current = null;
    touchCurrentX.current = null;
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

  const toggleAudio = () => {
    if (isPlaying) {
      if (navigator.vibrate) navigator.vibrate(20);
      stopAudio();
    } else {
      playAudio();
    }
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
        setHasReadCurrentPage(true);
      };

      startTimeRef.current = ctx.currentTime;
      isPlayingRef.current = true;
      setIsPlaying(true);
      source.start();
      currentSourceRef.current = source;

      const updateHighlight = () => {
        if (!isPlayingRef.current) return;
        const elapsed = ctx.currentTime - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const wordIndex = Math.floor(progress * words.length);
        
        if (wordIndex >= 0 && wordIndex < words.length) {
          if (wordIndex !== highlightIndex) {
            setHighlightIndex(wordIndex);
          }
        } else if (progress >= 1) {
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
    setHasReadCurrentPage(false);
  }, [currentIndex]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-start py-2 sm:py-4 relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Floating Navigation Buttons */}
      {!isPlaying && hasReadCurrentPage && (
        <>
          {currentIndex > 0 && (
            <button 
              onClick={handlePrev}
              className={`fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-16 sm:h-16 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg transition-all active:scale-90 border ${isDark ? 'bg-[#1E1B4B]/80 text-[#FEF3C7] hover:bg-[#312E81] border-[#4C1D95]/30' : 'bg-white/80 text-[#166534] hover:bg-white border-[#BBF7D0]/60'}`}
              aria-label={t.previous}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {!isLastPage && (
            <button 
              onClick={handleNext}
              className={`fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(252,211,77,0.4)] transition-all active:scale-90 animate-[pulseScale_2s_infinite] ${isDark ? 'bg-[#FCD34D] text-[#451A03] hover:bg-[#F59E0B]' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-[0_0_20px_rgba(59,130,246,0.4)]'}`}
              aria-label={t.next}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </>
      )}

      <div 
        key={currentIndex} 
        className={`w-full max-w-[500px] flex flex-col gap-6 relative z-10 px-4 animate-[${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'}_0.4s_cubic-bezier(0.16,1,0.3,1)]`}
        style={{
          transform: swipeOffset ? `translateX(${swipeOffset}px) rotate(${swipeOffset * 0.05}deg)` : 'none',
          transition: swipeOffset ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        
        <div className={`w-full aspect-[4/3] relative overflow-hidden group rounded-[2rem] shadow-2xl ${isDark ? 'bg-[#23214A]/60' : 'bg-white/50'}`}>
          {currentPage?.imageUrl ? (
            <img 
              key={currentPage.imageUrl}
              src={currentPage.imageUrl} 
              alt="Story illustration" 
              className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out] transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-3 p-6 ${isDark ? 'text-[#6B7FD7]' : 'text-[#3B82F6]'}`}>
              <div className="relative">
                <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isDark ? 'border-[#312E81] border-t-[#FCD34D]' : 'border-[#BFDBFE] border-t-[#3B82F6]'}`} />
                <div className="absolute inset-0 flex items-center justify-center text-xs">✨</div>
              </div>
              <p className={`font-magic text-2xl text-center animate-pulse ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>{t.painting}</p>
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            {!isSaved && (
              <button 
                onClick={(e) => {
                  const btn = e.currentTarget;
                  const rect = btn.getBoundingClientRect();
                  
                  // Create flying icon
                  const flyer = document.createElement('div');
                  flyer.innerHTML = '📚';
                  flyer.style.position = 'fixed';
                  flyer.style.left = `${rect.left}px`;
                  flyer.style.top = `${rect.top}px`;
                  flyer.style.fontSize = '24px';
                  flyer.style.zIndex = '100';
                  flyer.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                  flyer.style.pointerEvents = 'none';
                  document.body.appendChild(flyer);

                  // Target position (approximate library icon position in header)
                  // In a real app we'd use a ref or context, but hardcoding top-right area works for this effect
                  const targetX = window.innerWidth - 60; 
                  const targetY = 20;

                  requestAnimationFrame(() => {
                    flyer.style.transform = `translate(${targetX - rect.left}px, ${targetY - rect.top}px) scale(0.5)`;
                    flyer.style.opacity = '0';
                  });

                  setTimeout(() => {
                    document.body.removeChild(flyer);
                    if (onSave) onSave();
                  }, 1000);
                }}
                className={`backdrop-blur-md p-3 rounded-full shadow-lg transition-all active:scale-95 group ${isDark ? 'bg-[#23214A]/90 text-[#FCD34D] hover:bg-[#312E81]' : 'bg-white/80 text-[#3B82F6] hover:bg-white'}`}
                title={t.saveToBookshelf}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
          </div>

          {showSaveSuccess && (
            <div className={`absolute top-14 right-4 px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-lg animate-[bounceIn_0.4s_ease-out] ${isDark ? 'bg-[#FCD34D] text-[#451A03]' : 'bg-[#3B82F6] text-white'}`}>
              {t.storySaved}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="space-y-4">
            <div className={`min-h-[160px] sm:min-h-[200px] backdrop-blur-md p-6 rounded-[2rem] overflow-y-auto scrollbar-hide shadow-inner ${isDark ? 'bg-[#23214A]/80' : 'bg-white/60'}`}>
              <p className={`text-lg sm:text-xl font-medium leading-relaxed transition-all ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>
                {words.map((word, idx) => {
                  const isActive = idx === highlightIndex;

                  return (
                    <span 
                      key={idx}
                      className={`inline-block mr-1.5 transition-all duration-300 rounded-md px-1 py-0.5 relative ${
                        isActive 
                          ? (isDark ? 'bg-[#FCD34D] text-[#451A03] scale-110 shadow-[0_0_10px_rgba(252,211,77,0.5)] font-bold -translate-y-0.5' : 'bg-[#3B82F6] text-white scale-110 shadow-[0_0_10px_rgba(59,130,246,0.5)] font-bold -translate-y-0.5')
                          : (isDark ? 'text-[#FEF3C7]' : 'text-[#166534]')
                      }`}
                    >
                      {word}
                    </span>
                  );
                })}
                {!currentPage?.text && <span className={`animate-pulse ${isDark ? 'text-[#6B7FD7]' : 'text-[#3B82F6]'}`}>...</span>}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Page Indicator moved above the button */}
            <div className="flex justify-center gap-2 mb-2">
              {story.pages.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? (isDark ? 'bg-[#FCD34D] w-4 shadow-[0_0_5px_#FCD34D]' : 'bg-[#3B82F6] w-4 shadow-[0_0_5px_#3B82F6]') : (isDark ? 'bg-white/10 w-1.5' : 'bg-[#166534]/20 w-1.5')}`} 
                />
              ))}
            </div>

            <button
              onClick={toggleAudio}
              disabled={!currentPage?.audioData && !isPlaying}
              className={`w-full flex items-center justify-center gap-3 py-3 sm:py-4 rounded-[1.5rem] transition-all overflow-hidden relative shadow-lg ${
                isPlaying 
                  ? (isDark ? 'bg-[#23214A]/60 backdrop-blur-md text-[#D1D5DB] hover:bg-[#23214A]/80' : 'bg-white/40 backdrop-blur-md text-[#166534] hover:bg-white/60')
                  : (isDark ? 'bg-gradient-to-r from-[#4338CA] to-[#312E81] text-[#FEF3C7] hover:brightness-110' : 'bg-gradient-to-r from-[#60A5FA] to-[#3B82F6] text-white hover:brightness-110')
              }`}
            >
              {isPlaying ? (
                <>
                  <div className="flex gap-1.5 items-end h-4">
                    <div className={`w-1.5 rounded-full animate-[soundWave_0.6s_infinite_0s] ${isDark ? 'bg-[#FCD34D]' : 'bg-[#3B82F6]'}`} />
                    <div className={`w-1.5 rounded-full animate-[soundWave_0.6s_infinite_0.1s] ${isDark ? 'bg-[#FCD34D]' : 'bg-[#3B82F6]'}`} />
                    <div className={`w-1.5 rounded-full animate-[soundWave_0.6s_infinite_0.2s] ${isDark ? 'bg-[#FCD34D]' : 'bg-[#3B82F6]'}`} />
                  </div>
                  <span className={`text-lg sm:text-xl font-magic tracking-wide ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>{t.reading}</span>
                </>
              ) : (
                <>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 ${isDark ? 'bg-[#FCD34D]/20' : 'bg-white/20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isDark ? 'text-[#FCD34D]' : 'text-white'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className={`text-xl sm:text-2xl font-magic tracking-wide relative z-10 uppercase font-bold drop-shadow-sm ${isDark ? 'text-[#FEF3C7]' : 'text-white'}`}>{t.readToMe}</span>
                </>
              )}
            </button>

            {isLastPage && !isPlaying && hasReadCurrentPage && (
              <div className="flex flex-col gap-3 w-full">
                {!isSaved && (
                  <button
                    onClick={handleSave}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-magic text-xl transition-all animate-[bounceIn_0.5s_ease-out] uppercase tracking-wide font-bold ${isDark ? 'text-[#451A03] bg-[#FCD34D] hover:bg-white shadow-[0_0_15px_rgba(252,211,77,0.4)]' : 'text-white bg-[#3B82F6] hover:bg-[#2563EB] shadow-[0_0_15px_rgba(59,130,246,0.4)]'}`}
                  >
                    <span>{t.saveToBookshelf}</span>
                  </button>
                )}
                <button
                  onClick={onReset}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-magic text-xl transition-all animate-[bounceIn_0.5s_ease-out] uppercase tracking-wide font-bold ${isDark ? 'text-[#FEF3C7] bg-[#4338CA] hover:bg-[#4C1D95]' : 'text-[#166534] bg-white hover:bg-[#F0FDF4]'}`}
                >
                  <span>{t.oneMore}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p className={`hidden md:block text-[10px] font-black uppercase tracking-[0.2em] mt-6 animate-pulse relative z-10 opacity-60 ${isDark ? 'text-[#6B7FD7]' : 'text-[#3B82F6]'}`}>
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
        @keyframes pulseScale {
          0%, 100% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.1); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default StoryReader;
