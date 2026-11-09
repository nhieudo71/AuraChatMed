import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Brain,
  ChevronDown,
  ChevronRight,
  Code2,
  PenTool,
  BarChart3,
  Languages,
  Stethoscope,
  FileText,
  FileSpreadsheet,
  File,
  Film,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { ChatMessage, ChatAttachment } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { formatFileSize } from '../utils/fileParser';

interface ChatAreaProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingMessage: string;
  streamingThinking?: string;
  onSelectStarterPrompt: (prompt: string) => void;
  systemPrompt?: string;
  ttsVoice?: string;
  activeModelName?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  streamingMessage,
  streamingThinking,
  onSelectStarterPrompt,
  systemPrompt,
  ttsVoice,
  activeModelName,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<{ [id: string]: boolean }>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (ttsVoice) {
      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) => v.name === ttsVoice);
      if (matched) utterance.voice = matched;
    }

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const toggleThinking = (id: string) => {
    setExpandedThinking((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const starterPrompts = [
    {
      title: 'Ôn Thi Y Khoa & Biện Luận',
      desc: 'Hỏi đáp lâm sàng, phân tích ECG, khí máu và tra cứu Y văn chuẩn',
      prompt: 'Chào Thầy! Em là sinh viên Y khoa đang ôn thi. Xin Thầy giúp em biện luận ca lâm sàng đau thắt ngực cấp và phân tích sự khác biệt giữa STEMI và NSTEMI theo khuyến cáo mới nhất.',
      icon: Stethoscope,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Tối ưu thuật toán & Code',
      desc: 'Viết giải thuật xử lý dữ liệu lớn với TypeScript & Clean Code',
      prompt: 'Hãy giúp tôi thiết kế một kiến trúc xử lý dữ liệu bất đồng bộ với TypeScript, áp dụng các best practices và giải thích chi tiết các trường hợp biên.',
      icon: Code2,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      title: 'Soạn thảo & Biên tập',
      desc: 'Viết bài thuyết trình hoặc thông cáo báo chí chuyên nghiệp',
      prompt: 'Hãy viết giúp tôi một bài thông cáo báo chí ra mắt tính năng AI mới, văn phong cuốn hút, chuyên nghiệp và có lời kêu gọi hành động (CTA) rõ ràng.',
      icon: PenTool,
      color: 'text-purple-500 bg-purple-500/10',
    },
    {
      title: 'Phân tích & Lập kế hoạch',
      desc: 'Kế hoạch kinh doanh và phân bổ nguồn lực khả thi',
      prompt: 'Phân tích mô hình kinh doanh SaaS B2B tại thị trường Đông Nam Á: Phân tích SWOT, chi phí thu hút khách hàng (CAC), giá trị vòng đời (LTV) và chiến lược thâm nhập thị trường.',
      icon: BarChart3,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Dịch thuật chuyên sâu',
      desc: 'Dịch tài liệu học thuật hoặc kỹ thuật chuẩn văn phong bản xứ',
      prompt: 'Dịch bài viết học thuật này sang tiếng Anh tự nhiên, học thuật và chuẩn mực quốc tế.',
      icon: Languages,
      color: 'text-rose-500 bg-rose-500/10',
    },
  ];

  const renderAttachmentBadge = (att: ChatAttachment) => {
    if (att.type === 'image' && (att.url || att.base64)) {
      const src = att.url || `data:${att.mimeType};base64,${att.base64}`;
      return (
        <div
          key={att.id}
          className="relative group rounded-xl overflow-hidden border border-white/20 bg-black/10 cursor-pointer"
          onClick={() => setPreviewImage(src)}
        >
          <img src={src} alt={att.name} className="w-28 h-28 object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium p-1 text-center truncate">
            {att.name}
          </div>
        </div>
      );
    }

    if (att.type === 'video' && (att.url || att.base64)) {
      const src = att.url || `data:${att.mimeType};base64,${att.base64}`;
      return (
        <div key={att.id} className="rounded-xl overflow-hidden border border-white/20 bg-black/20 p-2 max-w-xs">
          <div className="flex items-center gap-1.5 text-xs text-white mb-1 font-medium truncate">
            <Film size={14} />
            <span className="truncate">{att.name}</span>
          </div>
          <video src={src} controls className="w-full max-h-48 rounded-lg" />
        </div>
      );
    }

    // Documents (PDF, Word, Excel, PPTX, Text)
    const isDocx = att.type === 'docx';
    const isXlsx = att.type === 'xlsx';
    const isPdf = att.type === 'pdf';
    const isPptx = att.type === 'pptx';

    return (
      <div
        key={att.id}
        className="flex items-center gap-2 p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/25 text-white max-w-xs transition-all hover:bg-white/20"
      >
        <div className={`p-2 rounded-lg shrink-0 ${
          isPdf ? 'bg-rose-500/30 text-rose-100' :
          isDocx ? 'bg-blue-500/30 text-blue-100' :
          isXlsx ? 'bg-emerald-500/30 text-emerald-100' :
          isPptx ? 'bg-orange-500/30 text-orange-100' :
          'bg-stone-500/30 text-stone-100'
        }`}>
          {isPdf ? <FileText size={18} /> :
           isDocx ? <FileText size={18} /> :
           isXlsx ? <FileSpreadsheet size={18} /> :
           <File size={18} />}
        </div>
        <div className="overflow-hidden text-left flex-1">
          <div className="text-xs font-semibold truncate leading-tight">{att.name}</div>
          <div className="text-[10px] opacity-80 mt-0.5 flex items-center gap-1.5">
            <span className="uppercase font-mono">{att.type}</span>
            <span>•</span>
            <span>{formatFileSize(att.size)}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* Lightbox for Image Preview */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <img src={previewImage} alt="Xem ảnh phóng to" className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain" />
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Welcome State when no messages */}
        {messages.length === 0 && (
          <div className="py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
            {/* Header branding */}
            <div className="text-center space-y-3">
              <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-500 shadow-sm ring-1 ring-amber-500/20">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
                AuraChat AI
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                Trợ lý AI thông minh phong cách tối giản. Tốc độ phản hồi tức thì, đọc đa tài liệu (PDF, Word, Excel, PPTX, Ảnh, Video) và tùy chọn cấp độ trả lời ngắn gọn / chi tiết.
              </p>
            </div>

            {/* Active System Prompt Banner */}
            {systemPrompt && (
              <div className="p-3.5 rounded-2xl bg-stone-100/80 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300 flex items-center gap-2 max-w-xl mx-auto">
                <span className="font-semibold text-stone-900 dark:text-stone-100 shrink-0">
                  Đang kích hoạt ngữ cảnh riêng:
                </span>
                <span className="truncate italic">"{systemPrompt}"</span>
              </div>
            )}

            {/* Starter Suggestion Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {starterPrompts.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSelectStarterPrompt(item.prompt)}
                    className="flex flex-col text-left p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/50 hover:shadow-xs transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`p-2 rounded-xl ${item.color}`}>
                        <IconComponent size={18} />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 group-hover:text-amber-500 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-2">
                      {item.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages List */}
        {messages.length > 0 && (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isExpanded = expandedThinking[msg.id];

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Sparkles size={16} />
                    </div>
                  )}

                  <div className={`flex flex-col max-w-[88%] sm:max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* User Message Bubble */}
                    {isUser ? (
                      <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-amber-500 text-white text-[15px] leading-relaxed shadow-xs selection:bg-amber-600 selection:text-white space-y-2">
                        {/* Attached files preview */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pb-1">
                            {msg.attachments.map((att) => renderAttachmentBadge(att))}
                          </div>
                        )}
                        {msg.content && (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>
                    ) : (
                      /* AI Message Container */
                      <div className="w-full space-y-2">
                        {/* Thinking Accordion (for Gemini 4 Argon) */}
                        {msg.thinkingContent && (
                          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/40 overflow-hidden text-xs">
                            <button
                              onClick={() => toggleThinking(msg.id)}
                              className="w-full flex items-center justify-between px-3 py-2 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 font-medium">
                                <Brain size={14} className="text-amber-500" />
                                <span>Quá trình suy luận chuyên sâu (High Thinking)</span>
                              </div>
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            {isExpanded && (
                              <div className="px-3.5 py-2.5 border-t border-stone-200/60 dark:border-stone-800/60 text-stone-600 dark:text-stone-300 font-mono text-[12px] whitespace-pre-wrap leading-relaxed bg-white/40 dark:bg-stone-900/40">
                                {msg.thinkingContent}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Content text */}
                        <div className="px-1 text-stone-900 dark:text-stone-100">
                          <MarkdownRenderer content={msg.content} />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 pt-1 text-stone-400">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-200 transition-colors cursor-pointer"
                            title="Sao chép"
                            aria-label="Sao chép câu trả lời"
                          >
                            {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => handleSpeak(msg.id, msg.content)}
                            className={`p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer ${
                              speakingId === msg.id ? 'text-amber-500' : 'hover:text-stone-600 dark:hover:text-stone-200'
                            }`}
                            title={speakingId === msg.id ? 'Dừng đọc' : 'Đọc bằng giọng nói'}
                            aria-label="Đọc văn bản"
                          >
                            {speakingId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <User size={16} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* In-Flight Streaming Message */}
            {isStreaming && (
              <div className="flex gap-3.5 justify-start animate-in fade-in duration-100">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs animate-pulse">
                  <Sparkles size={16} />
                </div>

                <div className="flex flex-col max-w-[88%] sm:max-w-[80%] items-start w-full space-y-2">
                  {/* Streaming Thinking Content */}
                  {streamingThinking && (
                    <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-stone-600 dark:text-stone-300 font-mono leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1.5">
                        <Brain size={14} className="animate-spin" />
                        <span>Đang suy luận logic chuyên sâu...</span>
                      </div>
                      <div className="whitespace-pre-wrap">{streamingThinking}</div>
                    </div>
                  )}

                  {/* Streaming Text Content */}
                  <div className="px-1 text-stone-900 dark:text-stone-100 w-full">
                    {streamingMessage ? (
                      <MarkdownRenderer content={streamingMessage} />
                    ) : (
                      <div className="flex items-center gap-2 text-stone-400 text-xs py-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span>AI đang phản hồi với tốc độ cao...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
