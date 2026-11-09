import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FileText,
  Calendar,
  Presentation,
  CheckSquare,
  FormInput,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ChatMessage } from '../types';
import {
  createGoogleSheet,
  createGoogleDoc,
  createGoogleCalendarEvent,
  createGoogleSlidePresentation,
  createGoogleTask,
  createGoogleForm,
  WorkspaceExportResult,
} from '../lib/workspace';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  accessToken: string | null;
  onSignInRequired: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  title,
  messages,
  systemPrompt,
  accessToken,
  onSignInRequired,
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'sheets' | 'calendar' | 'slides' | 'tasks' | 'forms'>('docs');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({ show: false, title: '', description: '', action: async () => {} });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<WorkspaceExportResult | null>(null);

  // Calendar form state
  const [calSummary, setCalSummary] = useState(title);
  const [calDate, setCalDate] = useState(new Date().toISOString().slice(0, 10));
  const [calTime, setCalTime] = useState('09:00');

  // Task form state
  const [taskTitle, setTaskTitle] = useState(`Theo dõi: ${title}`);
  const [taskNotes, setTaskNotes] = useState('');

  // Form title state
  const [formTitle, setFormTitle] = useState(`Khảo sát: ${title}`);

  if (!isOpen) return null;

  const requestConfirmation = (actionTitle: string, desc: string, executeFn: () => Promise<void>) => {
    setConfirmDialog({
      show: true,
      title: actionTitle,
      description: desc,
      action: executeFn,
    });
  };

  const executeGoogleDoc = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setResult(null);
    const res = await createGoogleDoc(accessToken, title, messages, systemPrompt);
    setResult(res);
    setIsLoading(false);
  };

  const executeGoogleSheet = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setResult(null);
    const res = await createGoogleSheet(accessToken, title, messages);
    setResult(res);
    setIsLoading(false);
  };

  const executeGoogleCalendar = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setResult(null);
    const start = new Date(`${calDate}T${calTime}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour
    const desc = `Tạo từ cuộc trò chuyện AuraChat: "${title}"\n\nNội dung chính:\n${messages.slice(0, 3).map(m => `${m.role}: ${m.content.slice(0, 100)}...`).join('\n')}`;
    const res = await createGoogleCalendarEvent(accessToken, calSummary, desc, start, end);
    setResult(res);
    setIsLoading(false);
  };

  const executeGoogleSlides = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setResult(null);
    const slidesData = [
      {
        title: `Tổng quan: ${title}`,
        content: `Nội dung được phân tích và tổng hợp tự động từ cuộc hội thoại AuraChat.`,
      },
    ];

    messages.filter(m => m.role === 'model').slice(0, 4).forEach((m, i) => {
      slidesData.push({
        title: `Điểm then chốt #${i + 1}`,
        content: m.content.slice(0, 400),
      });
    });

    const res = await createGoogleSlidePresentation(accessToken, title, slidesData);
    setResult(res);
    setIsLoading(false);
  };

  const executeGoogleTask = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setResult(null);
    const notes = taskNotes || `Liên kết cuộc trò chuyện AuraChat: ${title}`;
    const res = await createGoogleTask(accessToken, taskTitle, notes);
    setResult(res);
    setIsLoading(false);
  };

  const executeGoogleForm = async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setResult(null);
    const res = await createGoogleForm(accessToken, formTitle, `Khảo sát ý kiến tự động cho chủ đề: ${title}`);
    setResult(res);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl p-6 shadow-2xl border border-stone-200 dark:border-stone-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <ExternalLink size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Tích hợp Google Workspace
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Xuất và đồng bộ trực tiếp lên tài khoản Google Drive & ứng dụng của bạn
            </p>
          </div>
        </div>

        {/* Auth check warning */}
        {!accessToken ? (
          <div className="p-4 my-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-500" />
              <span>
                Cần đăng nhập Google để đồng bộ với Google Workspace. Mọi thao tác đều được thực hiện với quyền cấp phép trực tiếp của bạn.
              </span>
            </div>
            <button
              onClick={onSignInRequired}
              className="shrink-0 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors"
            >
              Đăng nhập Google
            </button>
          </div>
        ) : null}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-stone-100 dark:border-stone-800">
          <button
            onClick={() => { setActiveTab('docs'); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'docs' ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <FileText size={15} />
            Google Docs
          </button>
          <button
            onClick={() => { setActiveTab('sheets'); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'sheets' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <FileSpreadsheet size={15} />
            Google Sheets
          </button>
          <button
            onClick={() => { setActiveTab('calendar'); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'calendar' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Calendar size={15} />
            Google Calendar
          </button>
          <button
            onClick={() => { setActiveTab('slides'); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'slides' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <Presentation size={15} />
            Google Slides
          </button>
          <button
            onClick={() => { setActiveTab('tasks'); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'tasks' ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <CheckSquare size={15} />
            Google Tasks
          </button>
          <button
            onClick={() => { setActiveTab('forms'); setResult(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shrink-0 ${
              activeTab === 'forms' ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 font-semibold' : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <FormInput size={15} />
            Google Forms
          </button>
        </div>

        {/* Tab content bodies */}
        <div className="py-4 min-h-[160px]">
          {activeTab === 'docs' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Tạo một tệp Google Docs mới trong tài khoản Google Drive của bạn chứa toàn bộ biên bản cuộc hội thoại và chỉ dẫn hệ thống.
              </p>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100">Tiêu đề tài liệu: </span>
                <span className="text-stone-600 dark:text-stone-400">AuraChat - {title}</span>
              </div>
              <button
                disabled={!accessToken || isLoading}
                onClick={() =>
                  requestConfirmation(
                    'Tạo tài liệu Google Docs?',
                    `Bạn có muốn tạo tài liệu "AuraChat - ${title}" trên Google Drive của mình không?`,
                    executeGoogleDoc
                  )
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Tạo Google Doc ngay
              </button>
            </div>
          )}

          {activeTab === 'sheets' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Tạo một bảng tính Google Sheets mới phân chia các cột: STT, Thời gian, Vai trò, Nội dung hội thoại và Ghi chú suy nghĩ.
              </p>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100">Tên bảng tính: </span>
                <span className="text-stone-600 dark:text-stone-400">AuraChat - {title}</span>
              </div>
              <button
                disabled={!accessToken || isLoading}
                onClick={() =>
                  requestConfirmation(
                    'Tạo Google Sheets?',
                    `Bạn có muốn tạo bảng tính mới "AuraChat - ${title}" trên Google Sheets không?`,
                    executeGoogleSheet
                  )
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Tạo Google Sheet ngay
              </button>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Lên lịch một cuộc họp hoặc sự kiện nhắc việc vào Google Calendar của bạn dựa trên chủ đề cuộc trò chuyện.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-stone-600 dark:text-stone-300">Tên sự kiện:</label>
                  <input
                    type="text"
                    value={calSummary}
                    onChange={(e) => setCalSummary(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block font-semibold mb-1 text-stone-600 dark:text-stone-300">Ngày:</label>
                    <input
                      type="date"
                      value={calDate}
                      onChange={(e) => setCalDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block font-semibold mb-1 text-stone-600 dark:text-stone-300">Giờ:</label>
                    <input
                      type="time"
                      value={calTime}
                      onChange={(e) => setCalTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                    />
                  </div>
                </div>
              </div>
              <button
                disabled={!accessToken || isLoading}
                onClick={() =>
                  requestConfirmation(
                    'Thêm sự kiện Google Calendar?',
                    `Bạn có chắc chắn muốn thêm sự kiện "${calSummary}" vào ngày ${calDate} lúc ${calTime} không?`,
                    executeGoogleCalendar
                  )
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Thêm vào Google Calendar
              </button>
            </div>
          )}

          {activeTab === 'slides' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Tạo một bài thuyết trình Google Slides với các slide tóm tắt các điểm ý then chốt từ cuộc hội thoại.
              </p>
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs">
                <span className="font-semibold text-stone-900 dark:text-stone-100">Tiêu đề bài trình chiếu: </span>
                <span className="text-stone-600 dark:text-stone-400">AuraChat - {title}</span>
              </div>
              <button
                disabled={!accessToken || isLoading}
                onClick={() =>
                  requestConfirmation(
                    'Tạo Google Slides?',
                    `Bạn có muốn tạo bộ slide mới "AuraChat - ${title}" trên Google Slides không?`,
                    executeGoogleSlides
                  )
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Tạo Google Slides ngay
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Tạo một mục công việc cần làm mới trong ứng dụng Google Tasks của bạn.
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-stone-600 dark:text-stone-300">Nhiệm vụ:</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-stone-600 dark:text-stone-300">Ghi chú thêm:</label>
                  <input
                    type="text"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="Tùy chọn..."
                    className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                  />
                </div>
              </div>
              <button
                disabled={!accessToken || isLoading}
                onClick={() =>
                  requestConfirmation(
                    'Thêm nhiệm vụ Google Tasks?',
                    `Bạn có muốn tạo nhiệm vụ "${taskTitle}" vào danh sách Google Tasks không?`,
                    executeGoogleTask
                  )
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Thêm vào Google Tasks
              </button>
            </div>
          )}

          {activeTab === 'forms' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600 dark:text-stone-300">
                Tạo một biểu mẫu Google Forms trực tuyến từ chủ đề cuộc trò chuyện.
              </p>
              <div className="text-xs">
                <label className="block font-semibold mb-1 text-stone-600 dark:text-stone-300">Tiêu đề biểu mẫu:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-xs"
                />
              </div>
              <button
                disabled={!accessToken || isLoading}
                onClick={() =>
                  requestConfirmation(
                    'Tạo biểu mẫu Google Forms?',
                    `Bạn có muốn tạo Google Form "${formTitle}" không?`,
                    executeGoogleForm
                  )
                }
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                Tạo Google Form ngay
              </button>
            </div>
          )}
        </div>

        {/* Loading state indicator */}
        {isLoading && (
          <div className="p-3 my-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
            <Loader2 size={16} className="animate-spin text-blue-500" />
            <span>Đang gửi yêu cầu và tạo tài nguyên trên Google Workspace...</span>
          </div>
        )}

        {/* Result link */}
        {result && (
          <div className={`p-4 my-3 rounded-xl border text-xs ${
            result.success
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}>
            <div className="flex items-center gap-2 font-semibold mb-1">
              {result.success ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-red-500" />}
              <span>{result.success ? 'Tạo thành công!' : 'Đã có lỗi xảy ra'}</span>
            </div>
            {result.error && <p>{result.error}</p>}
            {result.url && (
              <div className="mt-2">
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors"
                >
                  <ExternalLink size={13} />
                  Mở {result.title} trong tab mới
                </a>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Mandatory Explicit Confirmation Dialog for Data Mutation */}
      {confirmDialog.show && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-2xl border border-stone-200 dark:border-stone-800">
            <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {confirmDialog.title}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-300 mt-2 leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmDialog({ show: false, title: '', description: '', action: async () => {} })}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={async () => {
                  const act = confirmDialog.action;
                  setConfirmDialog({ show: false, title: '', description: '', action: async () => {} });
                  await act();
                }}
                className="px-4 py-1.5 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
              >
                Xác nhận tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
