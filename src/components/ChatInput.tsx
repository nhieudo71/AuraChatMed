import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  Brain,
  Sparkles,
  Paperclip,
  X,
  Zap,
  FileText,
  FileSpreadsheet,
  File,
  Film,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import { ChatAttachment, ResponseStyleLevel } from '../types';
import { formatFileSize } from '../utils/fileParser';

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
  // File attachments
  attachments: ChatAttachment[];
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  isProcessingFile: boolean;
  // Response style / length
  responseStyle: ResponseStyleLevel;
  onSelectResponseStyle: (style: ResponseStyleLevel) => void;
  // Speed acceleration
  speedMode: boolean;
  onToggleSpeedMode: () => void;
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
  attachments,
  onAddFiles,
  onRemoveAttachment,
  isProcessingFile,
  responseStyle,
  onSelectResponseStyle,
  speedMode,
  onToggleSpeedMode,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
      if (!isStreaming && (input.trim() || attachments.length > 0) && !isProcessingFile) {
        onSend();
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onAddFiles(Array.from(files));
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onAddFiles(Array.from(files));
    }
  };

  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isProcessingFile;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-16 sm:pb-4">
      {/* Container card with Drag & Drop */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl bg-white dark:bg-stone-900 border transition-all p-3 shadow-md ${
          isDragging
            ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5'
            : 'border-stone-200 dark:border-stone-800 focus-within:border-amber-500/60 focus-within:ring-2 focus-within:ring-amber-500/10'
        }`}
      >
        {/* Top Badges / Toggles Bar */}
        <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-stone-100 dark:border-stone-800/80 text-[11px] gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Response Style Level (ChatGPT style: Ngắn gọn / Tiêu chuẩn / Chi tiết) */}
            <div className="flex items-center rounded-xl bg-stone-100 dark:bg-stone-800/80 p-0.5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => onSelectResponseStyle('concise')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  responseStyle === 'concise'
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title="Trả lời thẳng vào trọng tâm, cô đọng, gạch đầu dòng rõ ràng, không dài dòng"
              >
                <Zap size={11} className={responseStyle === 'concise' ? 'text-white' : 'text-amber-500'} />
                <span>Ngắn gọn</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectResponseStyle('balanced')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  responseStyle === 'balanced'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title="Độ dài cân bằng chuẩn mực"
              >
                <span>Tiêu chuẩn</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectResponseStyle('detailed')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  responseStyle === 'detailed'
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 font-semibold shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                }`}
                title="Phân tích chi tiết chuyên sâu, giải thích cặn kẽ"
              >
                <span>Chi tiết</span>
              </button>
            </div>

            {/* Speed Boost Button */}
            <button
              type="button"
              onClick={onToggleSpeedMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                speedMode
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={speedMode ? 'Chế độ siêu tốc đang bật: Tối ưu phản hồi ngay tức thì' : 'Bật tăng tốc độ phản hồi'}
            >
              <Zap size={12} className={speedMode ? 'text-amber-500 fill-amber-500' : 'text-stone-400'} />
              <span>{speedMode ? 'Siêu tốc (Bật)' : 'Siêu tốc'}</span>
            </button>

            {/* Thinking Mode Toggle (gemini-4-argon with thinkingLevel: HIGH) */}
            <button
              type="button"
              onClick={onToggleThinkingMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                thinkingMode
                  ? 'bg-purple-500 text-white shadow-xs'
                  : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title="Kích hoạt tư duy logic chuyên sâu (gemini-4-argon)"
            >
              <Brain size={12} className={thinkingMode ? 'text-white' : 'text-purple-500'} />
              <span>{thinkingMode ? 'Tư duy sâu (Bật)' : 'Tư duy sâu'}</span>
            </button>

            {/* System Prompt indicator */}
            <button
              type="button"
              onClick={onOpenSystemPrompt}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer ${
                hasSystemPrompt
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700'
              }`}
            >
              <Sparkles size={11} />
              <span>{hasSystemPrompt ? 'Chỉ dẫn đang bật' : '+ Chỉ dẫn'}</span>
            </button>
          </div>

          <span className="hidden sm:inline text-stone-400 text-[10px]">
            Shift + Enter để xuống dòng
          </span>
        </div>

        {/* Attachment chips row above textarea */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 mb-1.5 border-b border-stone-100 dark:border-stone-800">
            {attachments.map((att) => {
              const isPdf = att.type === 'pdf';
              const isDocx = att.type === 'docx';
              const isXlsx = att.type === 'xlsx';
              const isPptx = att.type === 'pptx';
              const isImage = att.type === 'image';
              const isVideo = att.type === 'video';

              return (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 p-1.5 pr-2 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 animate-in fade-in max-w-xs"
                >
                  {isImage && (att.url || att.base64) ? (
                    <img
                      src={att.url || `data:${att.mimeType};base64,${att.base64}`}
                      alt={att.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isPdf
                          ? 'bg-rose-500/10 text-rose-500'
                          : isDocx
                          ? 'bg-blue-500/10 text-blue-500'
                          : isXlsx
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : isPptx
                          ? 'bg-orange-500/10 text-orange-500'
                          : isVideo
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isPdf || isDocx ? (
                        <FileText size={13} />
                      ) : isXlsx ? (
                        <FileSpreadsheet size={13} />
                      ) : isVideo ? (
                        <Film size={13} />
                      ) : (
                        <File size={13} />
                      )}
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <div className="truncate font-medium text-[11px] max-w-[120px] sm:max-w-[160px]">
                      {att.name}
                    </div>
                    <div className="text-[9px] text-stone-400 font-mono">
                      {formatFileSize(att.size)}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    className="p-1 text-stone-400 hover:text-red-500 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ml-1 cursor-pointer"
                    title="Gỡ tệp này"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessingFile && (
          <div className="flex items-center gap-2 p-2 mb-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
            <Loader2 size={13} className="animate-spin" />
            <span>Đang đọc và xử lý cấu trúc tài liệu...</span>
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            attachments.length > 0
              ? 'Nhập yêu cầu phân tích tài liệu đã tải lên... (Shift + Enter để xuống dòng)'
              : 'Hỏi bất cứ điều gì, tải tệp tài liệu hoặc nhấn mic để nói...'
          }
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-[15px] resize-none focus:outline-none min-h-[44px] max-h-[180px] leading-relaxed py-1"
        />

        {/* Bottom Actions Row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-stone-400">
            {/* File Upload Button (PDF, Word, Excel, PPTX, TXT, MD, Image, Video) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Đính kèm ảnh, video, PDF, Word, Excel, PPTX, TXT, MD để AI đọc"
              aria-label="Tải tệp lên"
            >
              <Paperclip size={17} />
            </button>

            {/* Microphone button for Gemini Transcribe */}
            <button
              type="button"
              onClick={onOpenVoiceModal}
              className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
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
                type="button"
                onClick={onStopStreaming}
                className="w-9 h-9 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-xs cursor-pointer"
                title="Dừng tạo phản hồi"
                aria-label="Dừng phản hồi"
              >
                <Square size={14} className="fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!canSend}
                className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-30 disabled:hover:bg-amber-500 text-white flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
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
