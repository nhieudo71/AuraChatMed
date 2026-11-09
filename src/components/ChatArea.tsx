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
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

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
      prompt: 'Hãy soạn thảo một thông cáo ra mắt sản phẩm công nghệ mới đầy ấn tượng, lôi cuốn và súc tích.',
      icon: PenTool,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Phân tích & Lập kế hoạch',
      desc: 'Kế hoạch kinh doanh và phân bổ nguồn lực khả thi',
      prompt: 'Hãy lập kế hoạch triển khai chiến lược kinh doanh cho một ứng dụng SaaS trong 6 tháng đầu tiên, kèm theo các chỉ số KPI cần theo dõi.',
      icon: BarChart3,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Dịch thuật chuyên sâu',
      desc: 'Dịch tài liệu học thuật hoặc kỹ thuật chuẩn văn phong bản xứ',
      prompt: 'Hãy phân tích và dịch các thuật ngữ chuyên ngành công nghệ AI mới nhất từ tiếng Anh sang tiếng Việt với chú giải dễ hiểu.',
      icon: Languages,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Welcome Empty State */}
        {messages.length === 0 && !isStreaming ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-xs">
                <Sparkles size={28} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
                AuraChat AI
              </h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
                Trợ lý AI thông minh phong cách tối giản. Hỗ trợ truyền phát thời gian thực, suy nghĩ logic chuyên sâu, nhận diện giọng nói và tích hợp Google Workspace.
              </p>
            </div>

            {/* System prompt banner if present */}
            {systemPrompt && systemPrompt.trim() && (
              <div className="p-3 max-w-lg mx-auto rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Đang kích hoạt ngữ cảnh riêng: </span>
                <span className="italic">"{systemPrompt.slice(0, 80)}..."</span>
              </div>
            )}

            {/* Prompt Starters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl text-left pb-4">
              {starterPrompts.map((starter, i) => {
                const Icon = starter.icon;
                return (
                  <button
                    key={i}
                    onClick={() => onSelectStarterPrompt(starter.prompt)}
                    className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 hover:border-amber-500/40 hover:bg-white dark:hover:bg-stone-850 hover:shadow-xs transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${starter.color}`}>
                        <Icon size={15} />
                      </div>
                      <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {starter.title}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {starter.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message List */
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
                      <div className="px-4 py-3 rounded-2xl rounded-tr-xs bg-amber-500 text-white text-[15px] leading-relaxed shadow-xs selection:bg-amber-600 selection:text-white whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    ) : (
                      /* AI Message Container */
                      <div className="w-full space-y-2">
                        {/* Thinking Accordion (for Gemini 4 Argon) */}
                        {msg.thinkingContent && (
                          <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-850/40 overflow-hidden text-xs">
                            <button
                              onClick={() => toggleThinking(msg.id)}
                              className="w-full flex items-center justify-between px-3 py-2 text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
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
                            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                            title="Sao chép"
                            aria-label="Sao chép câu trả lời"
                          >
                            {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                          <button
                            onClick={() => handleSpeak(msg.id, msg.content)}
                            className={`p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
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

            {/* Currently Streaming Message */}
            {isStreaming && (
              <div className="flex gap-3.5 justify-start animate-in fade-in duration-100">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div className="flex-1 max-w-[88%] sm:max-w-[80%] space-y-2">
                  {streamingThinking && (
                    <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs text-amber-800 dark:text-amber-300 font-mono">
                      <div className="flex items-center gap-1.5 font-semibold mb-1">
                        <Brain size={14} className="animate-pulse text-amber-500" />
                        <span>Đang suy luận logic...</span>
                      </div>
                      <div className="text-[12px] opacity-80 whitespace-pre-wrap line-clamp-3">
                        {streamingThinking}
                      </div>
                    </div>
                  )}

                  <div className="px-1 text-stone-900 dark:text-stone-100">
                    <MarkdownRenderer content={streamingMessage} />
                    <span className="inline-block w-2 h-4 ml-1 bg-amber-500 animate-pulse rounded-xs" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};
