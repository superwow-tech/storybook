
export type Language = 'en' | 'lt';

export type View = 'wizard' | 'reader' | 'library';

export type SoundType = 'magic' | 'animal' | 'nature' | 'mechanical' | 'transport' | 'emotion';

export interface SoundEffect {
  word: string;
  type: SoundType;
}

export interface Page {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioData?: string;
  soundEffects?: SoundEffect[];
}

export interface Story {
  id?: string;
  timestamp?: number;
  title: string;
  pages: Page[];
  language: Language;
}

export interface AppState {
  hasStarted: boolean;
  isGenerating: boolean;
  currentStory: Story | null;
  currentPageIndex: number;
  language: Language;
  savedStories: Story[];
  view: View;
}
