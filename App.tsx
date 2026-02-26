
import React, { useState, useEffect } from 'react';
import { AppState, Story, Language } from './types';
import { translations } from './translations';
import LandingPage from './components/LandingPage';
import StoryWizard from './components/StoryWizard';
import StoryReader from './components/StoryReader';
import InfoPanel from './components/InfoPanel';
import { gemini } from './geminiService';

const STORAGE_KEY = 'magic_dziulis_stories';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    hasStarted: false,
    isGenerating: false,
    currentStory: null,
    currentPageIndex: 0,
    language: 'lt',
    savedStories: []
  });

  const [showInfo, setShowInfo] = useState(false);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);

  const t = translations[state.language];

  // Load saved stories on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...prev, savedStories: parsed }));
      } catch (e) {
        console.error("Failed to parse saved stories", e);
      }
    }
  }, []);

  // Persist saved stories whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedStories));
  }, [state.savedStories]);

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
      isGenerating: false
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
        isGenerating: false 
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
      isGenerating: false
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
    <div className="h-full flex flex-col relative overflow-hidden bg-transparent">
      <div className="absolute top-0 right-0 w-[50%] h-[40%] bg-green-100/40 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[30%] bg-yellow-50/40 blur-[100px] rounded-full pointer-events-none -z-10" />

      <header className="px-6 py-4 flex justify-between items-center bg-transparent fixed top-0 left-0 right-0 z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer group active:scale-95 transition-transform"
          onClick={handleReset}
        >
          <span className="text-2xl sm:text-3xl group-hover:rotate-12 transition-transform">🌿</span>
          <h1 className="text-2xl sm:text-3xl font-magic text-[#4a5d23] leading-none pt-1 tracking-tight">Magic Dziulis</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleLanguage}
            className="w-10 h-10 hover:bg-white/40 rounded-full transition-all flex items-center justify-center font-bold text-[11px] sm:text-xs uppercase tracking-wider text-[#4a5d23]"
            aria-label="Switch Language"
          >
            {state.language === 'en' ? 'LT' : 'EN'}
          </button>
          
          <button 
            onClick={() => setShowInfo(!showInfo)}
            className="w-10 h-10 hover:bg-white/40 rounded-full transition-all flex items-center justify-center"
            aria-label="Informacija"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#4a5d23]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-y-auto scrollbar-hide px-4 pt-12 pb-8 sm:py-6 md:px-8 flex flex-col items-center justify-start sm:justify-center">
        <div className="w-full max-w-4xl flex flex-col items-center">
          {!state.currentStory && !state.isGenerating && (
            <StoryWizard 
              onGenerate={generateStory} 
              language={state.language} 
              savedStories={state.savedStories}
              onLoadStory={loadSavedStory}
              onDeleteStory={deleteSavedStory}
            />
          )}

          {state.isGenerating && (
            <div className="flex flex-col items-center justify-center w-full max-w-lg relative py-12">
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-[#9bbf6b] rounded-full animate-[floatUp_6s_infinite_ease-in-out]"
                    style={{
                      width: Math.random() * 8 + 4 + 'px',
                      height: Math.random() * 8 + 4 + 'px',
                      left: Math.random() * 100 + '%',
                      bottom: '-10%',
                      animationDelay: Math.random() * 5 + 's',
                      opacity: Math.random() * 0.5 + 0.2
                    }}
                  />
                ))}
              </div>

              <div className="relative mb-10">
                <div className="absolute -inset-10 bg-[#9bbf6b]/20 blur-[60px] rounded-full animate-pulse" />
                <div className="w-36 h-36 md:w-44 md:h-44 bg-gradient-to-br from-[#9bbf6b] to-[#749e47] rounded-[3.5rem] flex items-center justify-center shadow-[0_25px_60px_-10px_rgba(116,158,71,0.4)] relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full animate-[sweep_4s_infinite]" />
                  <div className="relative z-10 text-white animate-[bookFlap_2s_infinite_ease-in-out]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 md:h-24 md:w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="absolute top-4 right-4 text-white/60 text-xl animate-pulse">🌿</div>
                  <div className="absolute bottom-6 left-6 text-white/50 text-lg animate-pulse" style={{ animationDelay: '1.2s' }}>🌼</div>
                </div>
              </div>

              <div className="text-center space-y-3 relative z-10 px-6">
                <div className="h-12 overflow-hidden flex items-center justify-center">
                  <p key={loadingMessageIdx} className="text-2xl md:text-3xl font-script text-[#4a5d23] animate-[bounceIn_0.6s_cubic-bezier(0.175,0.885,0.32,1.275)]">
                    {t.loadingMessages[loadingMessageIdx]}
                  </p>
                </div>
                <p className="text-[#749e47] font-bold text-xs md:text-sm tracking-[0.2em] uppercase">
                  {t.waitMoment}
                </p>
              </div>
            </div>
          )}

          {state.currentStory && (
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
