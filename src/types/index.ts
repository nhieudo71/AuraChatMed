export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  thinkingContent?: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  systemPrompt?: string;
  model: string;
  thinkingLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: string;
  updatedAt: string;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  category: 'llm' | 'tts' | 'image_video';
  baseUrl: string;
  apiKey: string; // Stored encrypted
  models: string[];
  selectedModel: string;
  updatedAt: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  ttsVoice?: string;
  ttsRate?: number;
  ttsPitch?: number;
  ttsAutoPlay?: boolean;
  language: 'vi' | 'en' | 'ja' | 'ko' | 'zh' | 'fr' | 'de';
  hasCustomApiKey?: boolean;
  activeProviderId?: string; // id of CustomProviderConfig (LLM) or 'default'
  activeTtsProviderId?: string; // id of CustomProviderConfig (TTS) or 'default'
  activeImageProviderId?: string; // id of CustomProviderConfig (Image/Video) or 'default'
}

export interface APIBackupPayload {
  app: 'AuraChat';
  version: number;
  exportedAt: string;
  providers: CustomProviderConfig[];
  userPreferences?: Partial<UserPreferences>;
}

export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'md';
