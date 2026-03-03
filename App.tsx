
import React, { useState, useEffect, useRef } from 'react';
import { get, set } from 'idb-keyval';
import { AppState, Story, Language } from './types';
import { translations } from './translations';
import LandingPage from './components/LandingPage';
import StoryWizard from './components/StoryWizard';
import StoryReader from './components/StoryReader';
import InfoPanel from './components/InfoPanel';
import Library from './components/Library';
import InteractiveLoading from './components/InteractiveLoading';
import { gemini } from './geminiService';

const STORAGE_KEY = 'magic_dziulis_stories';
const CURRENT_STORY_KEY = 'magic_dziulis_current_story';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    hasStarted: false,
    isGenerating: false,
    currentStory: null,
    currentPageIndex: 0,
    language: 'lt',
    savedStories: [],
    view: 'wizard',
    theme: 'dark'
  });

  const [showInfo, setShowInfo] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  const t = translations[state.language];

  // Load saved stories and current story on mount
  useEffect(() => {
    Promise.all([
      get(STORAGE_KEY),
      get(CURRENT_STORY_KEY)
    ]).then(([saved, current]) => {
      setState(prev => ({
        ...prev,
        savedStories: Array.isArray(saved) ? saved : [],
        currentStory: current || null,
        // If we have a current story but haven't started, maybe we should auto-start or show a "continue" option?
        // For now, let's just load it into state.
      }));
    }).catch(err => console.error("Failed to load data from IndexedDB", err));
  }, []);

  // Persist saved stories whenever they change
  useEffect(() => {
    if (state.hasStarted || state.savedStories.length > 0) {
      set(STORAGE_KEY, state.savedStories).catch(err => console.error("Failed to save stories", err));
    }
  }, [state.savedStories, state.hasStarted]);

  // Persist current story whenever it changes
  useEffect(() => {
    if (state.currentStory) {
      set(CURRENT_STORY_KEY, state.currentStory).catch(err => console.error("Failed to save current story", err));
    } else if (state.hasStarted) {
      // Only clear if we have started (to avoid clearing on initial empty render)
      set(CURRENT_STORY_KEY, null).catch(err => console.error("Failed to clear current story", err));
    }
  }, [state.currentStory, state.hasStarted]);

  useEffect(() => {
    let interval: any;
    if (state.isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % t.loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [state.isGenerating, t.loadingMessages.length]);

  useEffect(() => {
    if (!bgAudioRef.current) return;
    
    const audio = bgAudioRef.current;
    
    if (state.view === 'reader' || !state.hasStarted) {
      // Fade out
      const fadeOut = setInterval(() => {
        if (audio.volume > 0.005) {
          audio.volume = Math.max(0, audio.volume - 0.005);
        } else {
          audio.volume = 0;
          audio.pause();
          clearInterval(fadeOut);
        }
      }, 100);
      return () => clearInterval(fadeOut);
    } else if (state.hasStarted && state.view !== 'reader') {
      // Fade in
      audio.play().catch(e => console.warn("Audio play failed:", e));
      const fadeIn = setInterval(() => {
        if (audio.volume < 0.025) {
          audio.volume = Math.min(0.025, audio.volume + 0.005);
        } else {
          clearInterval(fadeIn);
        }
      }, 100);
      return () => clearInterval(fadeIn);
    }
  }, [state.view, state.hasStarted]);

  const handleStart = async () => {
    if (!bgAudioRef.current) {
      bgAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1210/1210-preview.mp3');
      bgAudioRef.current.loop = true;
      bgAudioRef.current.volume = 0;
    }
    setState(prev => ({ ...prev, hasStarted: true }));
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      currentStory: null,
      currentPageIndex: 0,
      isGenerating: false,
      view: 'wizard'
    }));
  };

  const toggleLanguage = () => {
    setState(prev => ({
      ...prev,
      language: prev.language === 'en' ? 'lt' : 'en'
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const generateStory = async (userPrompt: string, pageCount: number) => {
    setState(prev => ({ ...prev, isGenerating: true, currentStory: null, currentPageIndex: 0 }));
    try {
      const storyStructure = await gemini.generateStoryStructure(userPrompt, state.language, pageCount);
      const firstPage = storyStructure.pages[0];
      const imageUrl = await gemini.generateImage(firstPage.imagePrompt);
      const audioData = await gemini.generateSpeech(firstPage.text, state.language);
      
      storyStructure.pages[0] = { ...firstPage, imageUrl, audioData };
      storyStructure.id = Date.now().toString();
      storyStructure.timestamp = Date.now();
      
      setState(prev => ({ 
        ...prev, 
        currentStory: storyStructure, 
        isGenerating: false,
        view: 'reader'
      }));

      loadRemainingPages(storyStructure);
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, isGenerating: false }));
      alert(t.errorMagic);
    }
  };

  const loadRemainingPages = async (story: Story) => {
    const updatedPages = [...story.pages];
    for (let i = 1; i < updatedPages.length; i++) {
      try {
        const imageUrl = await gemini.generateImage(updatedPages[i].imagePrompt);
        const audioData = await gemini.generateSpeech(updatedPages[i].text, state.language);
        updatedPages[i] = { ...updatedPages[i], imageUrl, audioData };
        
        setState(prev => {
          if (!prev.currentStory) return prev;
          const updatedStory = { ...prev.currentStory, pages: updatedPages };
          // If this story is already in savedStories, update it there too
          const savedIndex = prev.savedStories.findIndex(s => s.id === updatedStory.id);
          if (savedIndex !== -1) {
             const newSaved = [...prev.savedStories];
             newSaved[savedIndex] = updatedStory;
             return { ...prev, currentStory: updatedStory, savedStories: newSaved };
          }
          return { ...prev, currentStory: updatedStory };
        });
      } catch (err) {
        console.warn(`Failed to load page ${i}`, err);
      }
    }
  };

  const saveStory = (story: Story) => {
    setState(prev => {
      const alreadyExists = prev.savedStories.some(s => s.id === story.id);
      if (alreadyExists) return prev;
      return {
        ...prev,
        savedStories: [story, ...prev.savedStories]
      };
    });
  };

  const loadSavedStory = (story: Story) => {
    setState(prev => ({
      ...prev,
      currentStory: story,
      currentPageIndex: 0,
      isGenerating: false,
      view: 'reader'
    }));
  };

  const deleteSavedStory = (id: string) => {
    setState(prev => ({
      ...prev,
      savedStories: prev.savedStories.filter(s => s.id !== id)
    }));
  };

  if (!state.hasStarted) {
    return <LandingPage onStart={handleStart} language={state.language} theme={state.theme} />;
  }

  const isDark = state.theme === 'dark';

  return (
    <div className={`h-full flex flex-col relative overflow-hidden transition-colors duration-1000 ${isDark ? 'bg-gradient-to-b from-[#0B0F19] via-[#1A1B41] to-[#2E2A5B]' : 'bg-gradient-to-b from-[#BFDBFE] via-[#D1FAE5] to-[#86EFAC]'}`}>
      {/* Background Blobs */}
      <div className={`absolute top-0 right-0 w-[80%] h-[70%] blur-[130px] rounded-full pointer-events-none -z-10 transition-colors duration-1000 ${isDark ? 'bg-[#4C1D95]/30' : 'bg-[#7DD3FC]/50'}`} />
      <div className={`absolute bottom-0 left-0 w-[80%] h-[70%] blur-[130px] rounded-full pointer-events-none -z-10 transition-colors duration-1000 ${isDark ? 'bg-[#1D4ED8]/30' : 'bg-[#6EE7B7]/50'}`} />

      <header className={`px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center backdrop-blur-xl fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${isDark ? 'bg-[#23214A]/80' : 'bg-white/40'}`}>
        <div 
          className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
          onClick={handleReset}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={`w-8 h-8 sm:w-10 sm:h-10 filter hover:brightness-110 transition-all ${isDark ? 'drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]' : 'drop-shadow-md'}`}>
            <path d="M496.1 416h-27.2c-12.9 0-24.6-7.8-29.6-19.8l-15.5-37.1C412.2 331.3 367.8 248.8 306.6 128c-3.2-6.4-23.7-58.6-23.7-58.6s-9.8-23.2-16.1-23.2h-21.6c-6.3 0-16.1 23.2-16.1 23.2S208.6 121.6 205.4 128c-61.2 120.8-105.6 203.3-117.2 231.1l-15.5 37.1c-5 12-16.7 19.8-29.6 19.8H15.9c-10.8 0-18.7 10.3-15.5 20.6l10.8 34.6c2.4 7.6 9.4 12.8 17.4 12.8h454.8c8 0 15-5.2 17.4-12.8l10.8-34.6c3.2-10.3-4.7-20.6-15.5-20.6z" fill={isDark ? "#3730A3" : "#3B82F6"}/>
            <path d="M336.6 362.3c-15.8 12.5-35.7 19.8-57.1 19.8-23.5 0-45.1-8.8-61.6-23.3l-20.3 48.6c19.7 20.6 47.6 33.6 78.4 33.6 33.3 0 63.2-15.2 82.8-39.1l-22.2-39.6z" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
            <path d="M256 160l-17.9 36.3-40.1 5.8 29 28.3-6.8 39.9 35.8-18.8 35.8 18.8-6.8-39.9 29-28.3-40.1-5.8L256 160z" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
            <circle cx="180" cy="280" r="12" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
            <circle cx="340" cy="250" r="8" fill={isDark ? "#FCD34D" : "#F59E0B"}/>
          </svg>
          <h1 className={`text-xl sm:text-3xl font-magic leading-none pt-1 tracking-tight drop-shadow-md ${isDark ? 'text-[#FEF3C7]' : 'text-[#166534]'}`}>Magic Dziulis</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 relative">
          {state.hasStarted && !state.isGenerating && (
            <button 
              onClick={() => setState(prev => ({ ...prev, view: prev.view === 'library' ? 'wizard' : 'library', currentStory: null }))}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center ${isDark ? 'hover:bg-[#312E81]/50 text-[#FEF3C7]' : 'hover:bg-[#DCFCE7]/50 text-[#166534]'}`}
              aria-label="Library"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
          )}

          <button 
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(15);
              setShowMenu(!showMenu);
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all flex items-center justify-center ${isDark ? 'hover:bg-[#312E81]/50 text-[#FEF3C7]' : 'hover:bg-[#DCFCE7]/50 text-[#166534]'}`}
            aria-label="Menu"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between items-center">
              <span className={`block h-[2.5px] w-full rounded-full transform transition duration-300 ease-in-out ${showMenu ? 'rotate-45 translate-y-[6.5px]' : 'translate-y-0'} ${isDark ? 'bg-[#FEF3C7]' : 'bg-[#166534]'}`} />
              <span className={`block h-[2.5px] w-full rounded-full transition duration-300 ease-in-out ${showMenu ? 'opacity-0' : 'opacity-100'} ${isDark ? 'bg-[#FEF3C7]' : 'bg-[#166534]'}`} />
              <span className={`block h-[2.5px] w-full rounded-full transform transition duration-300 ease-in-out ${showMenu ? '-rotate-45 -translate-y-[6.5px]' : 'translate-y-0'} ${isDark ? 'bg-[#FEF3C7]' : 'bg-[#166534]'}`} />
            </div>
          </button>

          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className={`absolute top-full right-0 mt-2 w-48 rounded-2xl shadow-xl overflow-hidden z-50 animate-[fadeIn_0.2s_ease-out] ${isDark ? 'bg-[#23214A]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}`}>
                <div className="flex flex-col py-2">
                  <button 
                    onClick={() => { toggleTheme(); setShowMenu(false); }}
                    className={`flex items-center gap-4 px-5 py-3 transition-colors ${isDark ? 'hover:bg-[#312E81]/50 text-[#FEF3C7]' : 'hover:bg-[#DCFCE7]/50 text-[#166534]'}`}
                  >
                    {isDark ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    )}
                    <span className="font-bold text-[15px]">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>
                  
                  <button 
                    onClick={() => { toggleLanguage(); setShowMenu(false); }}
                    className={`flex items-center gap-4 px-5 py-3 transition-colors ${isDark ? 'hover:bg-[#312E81]/50 text-[#FEF3C7]' : 'hover:bg-[#DCFCE7]/50 text-[#166534]'}`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center font-black text-xs">
                      {state.language === 'en' ? 'LT' : 'EN'}
                    </div>
                    <span className="font-bold text-[15px]">{state.language === 'en' ? 'Lietuvių' : 'English'}</span>
                  </button>
                  
                  <button 
                    onClick={() => { setShowInfo(true); setShowMenu(false); }}
                    className={`flex items-center gap-4 px-5 py-3 transition-colors ${isDark ? 'hover:bg-[#312E81]/50 text-[#FEF3C7]' : 'hover:bg-[#DCFCE7]/50 text-[#166534]'}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-[15px]">Info</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto scrollbar-hide px-4 pt-20 pb-8 sm:pt-24 sm:pb-12 md:px-8 flex flex-col items-center justify-start sm:justify-center">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {state.view === 'wizard' && !state.isGenerating && (
            <StoryWizard 
              onGenerate={generateStory} 
              language={state.language} 
              theme={state.theme}
            />
          )}

          {state.view === 'library' && !state.isGenerating && (
            <Library 
              stories={state.savedStories}
              onLoadStory={loadSavedStory}
              onDeleteStory={deleteSavedStory}
              language={state.language}
              onClose={() => setState(prev => ({ ...prev, view: 'wizard' }))}
              theme={state.theme}
            />
          )}

          {state.isGenerating && (
            <InteractiveLoading language={state.language} theme={state.theme} />
          )}

          {state.view === 'reader' && state.currentStory && (
            <StoryReader 
              story={state.currentStory} 
              currentIndex={state.currentPageIndex}
              onPageChange={(idx) => setState(prev => ({ ...prev, currentPageIndex: idx }))}
              onReset={handleReset}
              language={state.language}
              onSave={() => saveStory(state.currentStory!)}
              isSaved={state.savedStories.some(s => s.id === state.currentStory?.id)}
              theme={state.theme}
            />
          )}
        </div>
      </main>

      {showInfo && <InfoPanel onClose={() => setShowInfo(false)} language={state.language} theme={state.theme} />}

      <style>{`
        @keyframes floatUpInteractive {
          0% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translateY(-120vh) scale(0.5) rotate(360deg); opacity: 0; }
        }
        @keyframes sweep {
          0% { transform: translateX(-150%) skewX(-15deg); }
          50%, 100% { transform: translateX(150%) skewX(-15deg); }
        }
        @keyframes bookFlap {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-10px) rotate(-2deg) scale(1.05); }
        }
        @keyframes floatUp {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-120vh) scale(0.5); opacity: 0; }
        }
        @keyframes bounceIn {
          0% { transform: translateY(20px) scale(0.8); opacity: 0; }
          60% { transform: translateY(-5px) scale(1.05); }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default App;
