import React, { useState } from 'react';
import { X, FileText, FileSpreadsheet, Presentation, Download, Check, FileCode, Layers } from 'lucide-react';
import { ChatMessage, ExportFormat } from '../types';
import { exportToPdf, exportToWord, exportToExcel, exportToPowerPoint, exportToMarkdown } from '../lib/export';
import { getConversationStats } from '../utils/chatUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  messages: ChatMessage[];
  systemPrompt?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  title,
  messages,
  systemPrompt,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const stats = getConversationStats(messages);

  const handleExport = async () => {
    setIsExporting(true);
    setSuccess(false);

    try {
      if (selectedFormat === 'pdf') {
        exportToPdf(title, messages, systemPrompt);
      } else if (selectedFormat === 'docx') {
        await exportToWord(title, messages, systemPrompt);
      } else if (selectedFormat === 'xlsx') {
        exportToExcel(title, messages);
      } else if (selectedFormat === 'pptx') {
        await exportToPowerPoint(title, messages);
      } else if (selectedFormat === 'md') {
        exportToMarkdown(title, messages, systemPrompt);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const formats = [
    {
      id: 'pdf',
      name: 'PDF Document (.pdf)',
      desc: 'Tài liệu A4 chuẩn in ấn, phong cách thanh lịch.',
      icon: FileText,
      color: 'text-red-500 bg-red-500/10',
    },
    {
      id: 'docx',
      name: 'Microsoft Word (.docx)',
      desc: 'Tệp văn bản Word hoàn chỉnh để tiếp tục chỉnh sửa.',
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      id: 'xlsx',
      name: 'Microsoft Excel (.xlsx)',
      desc: 'Bảng tính thống kê theo cột thời gian, lượt hỏi và câu trả lời.',
      icon: FileSpreadsheet,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      id: 'pptx',
      name: 'Microsoft PowerPoint (.pptx)',
      desc: 'Bộ slide thuyết trình tóm tắt các nội dung chính theo từng trang.',
      icon: Presentation,
      color: 'text-amber-500 bg-amber-500/10',
    },
    {
      id: 'md',
      name: 'Markdown (.md)',
      desc: 'Định dạng mã nguồn mở lý tưởng cho lập trình viên & ghi chú.',
      icon: FileCode,
      color: 'text-purple-500 bg-purple-500/10',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Download size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Xuất cuộc hội thoại
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Hỗ trợ đầy đủ định dạng PDF, Word, Excel, PowerPoint & Markdown
            </p>
          </div>
        </div>

        {/* Conversation stats bar */}
        <div className="flex items-center justify-between p-3 my-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
          <div>
            <span className="text-stone-500 dark:text-stone-400">Tổng tin nhắn: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{messages.length}</span>
          </div>
          <div>
            <span className="text-stone-500 dark:text-stone-400">Lượt hỏi: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">{stats.userCount}</span>
          </div>
          <div>
            <span className="text-stone-500 dark:text-stone-400">Số từ: </span>
            <span className="font-semibold text-stone-900 dark:text-stone-100">~{stats.totalWords}</span>
          </div>
        </div>

        {/* Format radio list */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {formats.map((fmt) => {
            const Icon = fmt.icon;
            const isSelected = selectedFormat === fmt.id;

            return (
              <div
                key={fmt.id}
                onClick={() => setSelectedFormat(fmt.id as ExportFormat)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 shadow-sm ring-1 ring-amber-500/30'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-stone-900'
                }`}
              >
                <div className={`p-2 rounded-xl ${fmt.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                    {fmt.name}
                  </div>
                  <div className="text-[14px] text-stone-500 dark:text-stone-400 mt-0.5">
                    {fmt.desc}
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-amber-500 bg-amber-500' : 'border-stone-300 dark:border-stone-600'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || messages.length === 0}
            className={`flex items-center gap-1.5 px-5 py-2 text-xs font-medium rounded-xl text-white shadow-sm transition-all ${
              success
                ? 'bg-emerald-600'
                : 'bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50'
            }`}
          >
            {success ? (
              <>
                <Check size={14} />
                Đã tải xuống!
              </>
            ) : isExporting ? (
              'Đang xuất...'
            ) : (
              <>
                <Download size={14} />
                Tải tệp ngay
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
