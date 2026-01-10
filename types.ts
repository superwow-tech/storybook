
export type ImageSize = '1K' | '2K' | '4K';
export type Language = 'en' | 'lt';

export interface Page {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioData?: string;
}

export interface Story {
  title: string;
  pages: Page[];
  language: Language;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppState {
  apiKeySelected: boolean;
  isGenerating: boolean;
  currentStory: Story | null;
  currentPageIndex: number;
  imageSize: ImageSize;
  language: Language;
}
