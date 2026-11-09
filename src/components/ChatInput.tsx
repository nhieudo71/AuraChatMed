import React, { useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  Brain,
  Sparkles,
  Paperclip,
} from 'lucide-react';

interface ChatInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  thinkingMode: boolean;
  onToggleThinkingMode: () => void;
  onOpenVoiceModal: () => void;
  onOpenSystemPrompt: () => void;
  hasSystemPrompt: boolean;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isStreaming,
  onStopStreaming,
  thinkingMode,
  onToggleThinkingMode,
  onOpenVoiceModal,
  onOpenSystemPrompt,
  hasSystemPrompt,
  disabled,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-16 sm:pb-4">
      {/* Container card */}
      <div className="relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/10 transition-all p-3">
        {/* Top Badges / Toggles */}
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-stone-100 dark:border-stone-800/80 text-[11px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Thinking Mode Toggle (gemini-4-argon with thinkingLevel: HIGH) */}
            <button
              onClick={onToggleThinkingMode}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                thinkingMode
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title="Kích hoạt chế độ suy nghĩ chuyên sâu (gemini-4-argon - High Thinking)"
            >
              <Brain size={13} className={thinkingMode ? 'text-white' : 'text-amber-500'} />
              <span>{thinkingMode ? 'Tư duy chuyên sâu (Argon Bật)' : 'Tư duy thường'}</span>
            </button>

            {/* System Prompt indicator */}
            <button
              onClick={onOpenSystemPrompt}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                hasSystemPrompt
                  ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-medium'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-700'
              }`}
            >
              <Sparkles size={12} />
              <span>{hasSystemPrompt ? 'Chỉ dẫn đang áp dụng' : '+ Chỉ dẫn hệ thống'}</span>
            </button>
          </div>

          <span className="hidden sm:inline text-stone-400 text-[10px]">
            Shift + Enter để xuống dòng
          </span>
        </div>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi bất cứ điều gì... (hoặc nhấn mic để nhập bằng giọng nói)"
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-[15px] resize-none focus:outline-none min-h-[44px] max-h-[180px] leading-relaxed py-1"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-stone-400">
            {/* Microphone button for Gemini Transcribe */}
            <button
              onClick={onOpenVoiceModal}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Nhận diện giọng nói với gemini-3.5-transcribe"
              aria-label="Nhập bằng giọng nói"
            >
              <Mic size={17} />
            </button>
          </div>

          {/* Send or Stop button */}
          <div>
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs"
                title="Dừng tạo phản hồi"
                aria-label="Dừng phản hồi"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button
                onClick={onSend}
                disabled={!input.trim()}
                className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-amber-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-xs"
                title="Gửi tin nhắn"
                aria-label="Gửi tin nhắn"
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
