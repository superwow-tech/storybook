
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

// Map of sound categories to high-quality short audio clips
const SFX_MAP: Record<string, string> = {
  magic: 'https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3', // Magical chime
  animal: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3', // Generic bird/animal
  nature: 'https://assets.mixkit.co/active_storage/sfx/2006/2006-preview.mp3', // Wind/Whoosh
  mechanical: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3', // Mechanical click/ding
  transport: 'https://assets.mixkit.co/active_storage/sfx/2011/2011-preview.mp3', // Choo choo / engine
  emotion: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3', // Surprise/Ding
};

const StoryReader: React.FC<Props> = ({ story, currentIndex, onPageChange, onReset, language, onSave, isSaved }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // To track which sound effects have already played for the current page
  const playedSfxRef = useRef<Set<number>>(new Set());

  const t = translations[language];
  const totalPages = story.pages.length;
  const isLastPage = currentIndex === totalPages - 1;
  const currentPage = story.pages[currentIndex];

  const words = currentPage?.text ? currentPage.text.trim().split(/\s+/) : [];

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
    playedSfxRef.current.clear();
  };

  const playSfx = async (type: string) => {
    const url = SFX_MAP[type];
    if (!url) return;
    
    try {
      const audio = new Audio(url);
      audio.volume = 0.4; // Slightly lower than voice
      audio.play();
    } catch (e) {
      console.warn("SFX failed to play", e);
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
            // Check all indices since last highlight to catch skipped triggers
            const startCheck = highlightIndex === -1 ? 0 : highlightIndex;
            const endCheck = wordIndex;

            for (let i = startCheck; i <= endCheck; i++) {
              if (i >= words.length) break;
              if (!playedSfxRef.current.has(i)) {
                const wordClean = words[i].toLowerCase().replace(/[.,!?;:]/g, '');
                const sfxMatch = currentPage.soundEffects?.find(s => 
                  s.word.toLowerCase().replace(/[.,!?;:]/g, '') === wordClean
                );

                if (sfxMatch) {
                  playedSfxRef.current.add(i);
                  playSfx(sfxMatch.type);
                }
              }
            }
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
  }, [currentIndex]);

  useEffect(() => {
    return () => stopAudio();
  }, []);

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-start py-2 sm:py-4"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-[500px] flex flex-col gap-6 relative z-10 px-4">
        
        <div className="w-full aspect-[4/3] bg-[#fcfaf5] relative overflow-hidden group rounded-[2rem] shadow-lg border border-white/40">
          {currentPage?.imageUrl ? (
            <img 
              key={currentPage.imageUrl}
              src={currentPage.imageUrl} 
              alt="Story illustration" 
              className="w-full h-full object-cover animate-[fadeIn_0.5s_ease-out] transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-[#9bbf6b]">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-[#e8e4d9] border-t-[#749e47] rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-xs">🌿</div>
              </div>
              <p className="font-magic text-2xl text-center text-[#4a5d23] animate-pulse">{t.painting}</p>
            </div>
          )}
          
          <div className="absolute top-4 right-4 flex gap-2">
            {!isSaved && (
              <button 
                onClick={handleSave}
                className="bg-white/90 backdrop-blur-md p-2 rounded-full text-[#749e47] shadow-sm border border-white/50 hover:bg-white transition-all active:scale-95"
                title={t.saveToBookshelf}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
            <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-[#4a5d23] shadow-sm border border-white/50 flex items-center">
              {currentIndex + 1} / {totalPages}
            </div>
          </div>

          {showSaveSuccess && (
            <div className="absolute top-14 right-4 bg-[#749e47] text-white px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-lg animate-[bounceIn_0.4s_ease-out]">
              {t.storySaved}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="space-y-4">
            <div className="min-h-[160px] sm:min-h-[200px] bg-white/60 backdrop-blur-md p-6 rounded-[2rem] overflow-y-auto scrollbar-hide shadow-sm">
              <p className="text-lg sm:text-xl font-medium leading-relaxed transition-all text-[#4a5d23]">
                {words.map((word, idx) => {
                  const isActive = idx === highlightIndex;
                  const wordClean = word.toLowerCase().replace(/[.,!?;:]/g, '');
                  const sfxMatch = currentPage.soundEffects?.find(s => 
                    s.word.toLowerCase().replace(/[.,!?;:]/g, '') === wordClean
                  );

                  return (
                    <span 
                      key={idx}
                      className={`inline-block mr-1.5 transition-all duration-300 rounded-md px-1 py-0.5 relative ${
                        isActive 
                          ? 'bg-[#749e47] text-white scale-110 shadow-sm font-bold -translate-y-0.5' 
                          : 'text-[#4a5d23]'
                      }`}
                    >
                      {word}
                      {sfxMatch && (
                        <span 
                          className={`absolute -top-2 -right-1 text-[10px] transition-all duration-500 ${
                            isActive ? 'opacity-100 scale-150 rotate-12 text-yellow-300' : 'opacity-30 scale-100 rotate-0 text-[#9bbf6b]'
                          }`}
                        >
                          🌿
                        </span>
                      )}
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
              className={`w-full flex items-center justify-center gap-3 py-3 sm:py-4 rounded-[1.5rem] transition-all overflow-hidden relative shadow-md ${
                isPlaying 
                  ? 'bg-white/60 backdrop-blur-md text-[#4a5d23]/60' 
                  : 'garden-button'
              }`}
            >
              {isPlaying ? (
                <>
                  <div className="flex gap-1.5 items-end h-4">
                    <div className="w-1.5 bg-[#749e47] rounded-full animate-[soundWave_0.6s_infinite_0s]" />
                    <div className="w-1.5 bg-[#749e47] rounded-full animate-[soundWave_0.6s_infinite_0.1s]" />
                    <div className="w-1.5 bg-[#749e47] rounded-full animate-[soundWave_0.6s_infinite_0.2s]" />
                  </div>
                  <span className="text-lg sm:text-xl font-magic text-[#4a5d23] tracking-wide">{t.reading}</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xl sm:text-2xl font-magic tracking-wide relative z-10 uppercase font-bold">{t.readToMe}</span>
                </>
              )}
            </button>

            {isLastPage && (
              <button
                onClick={onReset}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[1.5rem] font-magic text-xl text-[#4a5d23] bg-white/80 hover:bg-white transition-all animate-[bounceIn_0.5s_ease-out] shadow-sm uppercase tracking-wide font-bold"
              >
                <span>{t.oneMore}</span>
              </button>
            )}
          </div>

          <div className="flex justify-between items-center px-2 pb-4">
            <button 
              onClick={handlePrev} 
              disabled={currentIndex === 0}
              className={`flex items-center gap-1 text-[10px] font-black tracking-widest transition-all px-4 py-2.5 rounded-xl ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'text-[#4a5d23]/60 hover:text-[#4a5d23] hover:bg-white/30'}`}
            >
              <span>{t.previous}</span>
            </button>
            
            <div className="flex gap-2">
              {story.pages.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-[#749e47] w-4 shadow-sm' : 'bg-white/30 w-1.5'}`} 
                />
              ))}
            </div>

            <button 
              onClick={handleNext} 
              disabled={isLastPage}
              className={`flex items-center gap-1 text-[10px] font-black tracking-widest transition-all px-4 py-2.5 rounded-xl ${isLastPage ? 'opacity-0 pointer-events-none' : 'text-[#4a5d23]/60 hover:text-[#4a5d23] hover:bg-white/30'}`}
            >
              <span>{t.next}</span>
            </button>
          </div>
        </div>
      </div>
      
      <p className="hidden md:block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mt-6 animate-pulse relative z-10">
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
