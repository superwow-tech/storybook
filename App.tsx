
import React, { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { AppState, Story, Language } from './types';
import { translations } from './translations';
import LandingPage from './components/LandingPage';
import StoryWizard from './components/StoryWizard';
import StoryReader from './components/StoryReader';
import InfoPanel from './components/InfoPanel';
import Library from './components/Library';
import { gemini } from './geminiService';

const STORAGE_KEY = 'magic_dziulis_stories';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    hasStarted: false,
    isGenerating: false,
    currentStory: null,
    currentPageIndex: 0,
    language: 'lt',
    savedStories: [],
    view: 'wizard'
  });

  const [showInfo, setShowInfo] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  const t = translations[state.language];

  // Load saved stories on mount
  useEffect(() => {
    get(STORAGE_KEY).then((saved) => {
      if (saved && Array.isArray(saved)) {
        setState(prev => ({ ...prev, savedStories: saved }));
      } else {
        // Fallback to localStorage if they have old data
        const oldSaved = localStorage.getItem(STORAGE_KEY);
        if (oldSaved) {
          try {
            const parsed = JSON.parse(oldSaved);
            setState(prev => ({ ...prev, savedStories: parsed }));
            set(STORAGE_KEY, parsed); // Migrate to IndexedDB
            localStorage.removeItem(STORAGE_KEY); // Clean up
          } catch (e) {
            console.error("Failed to parse old saved stories", e);
          }
        }
      }
    }).catch(err => console.error("Failed to load stories from IndexedDB", err));
  }, []);

  // Persist saved stories whenever they change
  useEffect(() => {
    // Only save if we have actually loaded or modified stories
    if (state.hasStarted || state.savedStories.length > 0) {
      set(STORAGE_KEY, state.savedStories).catch(err => console.error("Failed to save stories to IndexedDB", err));
    }
  }, [state.savedStories, state.hasStarted]);

  useEffect(() => {
    let interval: any;
    if (state.isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIdx((prev) => (prev + 1) % t.loadingMessages.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [state.isGenerating, t.loadingMessages.length]);

  const handleStart = async () => {
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
        view: 'reader',
        savedStories: [storyStructure, ...prev.savedStories].slice(0, 12)
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
        savedStories: [story, ...prev.savedStories].slice(0, 12) // Keep last 12 stories
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
    return <LandingPage onStart={handleStart} language={state.language} />;
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-[#0B1026]">
      <div className="absolute top-0 right-0 w-[50%] h-[40%] bg-[#312e81]/40 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-[#4c1d95]/40 blur-[100px] rounded-full pointer-events-none -z-10" />

      <header className="px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center bg-[#0B1026]/60 backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b border-[#6B7FD7]/20">
        <div 
          className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
          onClick={handleReset}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-[0_0_10px_rgba(244,211,94,0.5)] filter hover:brightness-110 transition-all">
            <path d="M496.1 416h-27.2c-12.9 0-24.6-7.8-29.6-19.8l-15.5-37.1C412.2 331.3 367.8 248.8 306.6 128c-3.2-6.4-23.7-58.6-23.7-58.6s-9.8-23.2-16.1-23.2h-21.6c-6.3 0-16.1 23.2-16.1 23.2S208.6 121.6 205.4 128c-61.2 120.8-105.6 203.3-117.2 231.1l-15.5 37.1c-5 12-16.7 19.8-29.6 19.8H15.9c-10.8 0-18.7 10.3-15.5 20.6l10.8 34.6c2.4 7.6 9.4 12.8 17.4 12.8h454.8c8 0 15-5.2 17.4-12.8l10.8-34.6c3.2-10.3-4.7-20.6-15.5-20.6z" fill="#4338ca"/>
            <path d="M336.6 362.3c-15.8 12.5-35.7 19.8-57.1 19.8-23.5 0-45.1-8.8-61.6-23.3l-20.3 48.6c19.7 20.6 47.6 33.6 78.4 33.6 33.3 0 63.2-15.2 82.8-39.1l-22.2-39.6z" fill="#F4D35E"/>
            <path d="M256 160l-17.9 36.3-40.1 5.8 29 28.3-6.8 39.9 35.8-18.8 35.8 18.8-6.8-39.9 29-28.3-40.1-5.8L256 160z" fill="#F4D35E"/>
            <circle cx="180" cy="280" r="12" fill="#F4D35E"/>
            <circle cx="340" cy="250" r="8" fill="#F4D35E"/>
          </svg>
          <h1 className="text-xl sm:text-3xl font-magic text-[#F5E6CA] leading-none pt-1 tracking-tight drop-shadow-md">Magic Dziulis</h1>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          {state.hasStarted && !state.isGenerating && (
            <button 
              onClick={() => setState(prev => ({ ...prev, view: prev.view === 'library' ? 'wizard' : 'library', currentStory: null }))}
              className="w-9 h-9 sm:w-10 sm:h-10 hover:bg-[#2B3A67]/50 rounded-full transition-all flex items-center justify-center text-[#F5E6CA]"
              aria-label="Library"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={toggleLanguage}
            className="w-9 h-9 sm:w-10 sm:h-10 hover:bg-[#2B3A67]/50 rounded-full transition-all flex items-center justify-center font-bold text-[10px] sm:text-xs uppercase tracking-wider text-[#F5E6CA]"
            aria-label="Switch Language"
          >
            {state.language === 'en' ? 'LT' : 'EN'}
          </button>
          
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="w-9 h-9 sm:w-10 sm:h-10 hover:bg-[#2B3A67]/50 rounded-full transition-all flex items-center justify-center"
            aria-label="Informacija"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#F5E6CA]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto scrollbar-hide px-4 pt-20 pb-8 sm:pt-24 sm:pb-12 md:px-8 flex flex-col items-center justify-start sm:justify-center">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {state.view === 'wizard' && !state.isGenerating && (
            <StoryWizard 
              onGenerate={generateStory} 
              language={state.language} 
            />
          )}

          {state.view === 'library' && !state.isGenerating && (
            <Library 
              stories={state.savedStories}
              onLoadStory={loadSavedStory}
              onDeleteStory={deleteSavedStory}
              language={state.language}
              onClose={() => setState(prev => ({ ...prev, view: 'wizard' }))}
            />
          )}

          {state.isGenerating && (
            <div className="flex flex-col items-center justify-center w-full max-w-lg relative py-12">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(15 + (state.loadingClicks || 0) * 2)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-[#F4D35E] rounded-full animate-[floatUp_6s_infinite_ease-in-out] shadow-[0_0_10px_#F4D35E]"
                    style={{
                      width: Math.random() * 6 + 2 + 'px',
                      height: Math.random() * 6 + 2 + 'px',
                      left: Math.random() * 100 + '%',
                      bottom: '-10%',
                      animationDelay: Math.random() * 5 + 's',
                      opacity: Math.random() * 0.5 + 0.4
                    }}
                  />
                ))}
              </div>

              <div className="relative mb-10">
                <div className="absolute -inset-10 bg-[#4338ca]/30 blur-[60px] rounded-full animate-pulse" />
                <button 
                  onClick={() => setState(prev => ({ ...prev, loadingClicks: (prev.loadingClicks || 0) + 1 }))}
                  className="w-36 h-36 md:w-44 md:h-44 bg-gradient-to-br from-[#1e1b4b] to-[#312e81] border border-[#6B7FD7]/30 rounded-[3.5rem] flex items-center justify-center shadow-[0_25px_60px_-10px_rgba(43,58,103,0.5)] relative overflow-hidden group active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-[#F4D35E]/10 to-white/0 -translate-x-full animate-[sweep_4s_infinite]" />
                  <div className="relative z-10 text-[#F5E6CA] animate-[bookFlap_2s_infinite_ease-in-out] drop-shadow-[0_0_15px_rgba(244,211,94,0.3)]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 md:h-24 md:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="text-center space-y-3 relative z-10 px-6">
                <div className="h-12 overflow-hidden flex items-center justify-center">
                  <p key={loadingMessageIdx} className="text-2xl md:text-3xl font-script text-[#F5E6CA] animate-[bounceIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)] drop-shadow-md">
                    {t.loadingMessages[loadingMessageIdx]}
                  </p>
                </div>
                <p className="text-[#F4D35E] font-bold text-xs md:text-sm tracking-[0.2em] uppercase drop-shadow-sm">
                  {t.waitMoment}
                </p>
              </div>
            </div>
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
            />
          )}
        </div>
      </main>

      {showInfo && <InfoPanel onClose={() => setShowInfo(false)} language={state.language} />}

      <style>{`
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
