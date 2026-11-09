export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'text';
  mimeType: string;
  size: number;
  url?: string;
  base64?: string;
  extractedText?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'model' | 'system';
  content: string;
  thinkingContent?: string;
  attachments?: ChatAttachment[];
  createdAt: string;
  /** Số liệu đo lường của lượt trả lời, lưu lại để xem sau khi stream kết thúc. */
  metrics?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    source: 'provider' | 'estimate';
    elapsedMs: number;
  };
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

export type ResponseStyleLevel = 'concise' | 'balanced' | 'detailed';

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
  responseStyle?: ResponseStyleLevel; // Cấp độ trả lời: Ngắn gọn (concise), Tiêu chuẩn (balanced), Chi tiết (detailed)
  speedMode?: boolean; // Tăng tốc độ phản hồi tối đa
}

export interface APIBackupPayload {
  app: 'AuraChat';
  version: number;
  exportedAt: string;
  providers: CustomProviderConfig[];
  userPreferences?: Partial<UserPreferences>;
}

export type ExportFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'md';
