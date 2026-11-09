import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  Timer,
  Shuffle,
  ListChecks,
  Plus,
  Search,
  Pencil,
  Download,
  FolderOpen,
  ChevronRight,
  X,
  Save,
  Award,
  Clock,
  Eye,
  RotateCcw,
} from 'lucide-react';
import {
  MedicalQuestion,
  QuestionLibraryItem,
  QuestionType,
  StudyDocument,
  MedicalSpecialty,
  ExamCategory,
} from '../../types/medical';
import {
  QUESTION_TYPES,
  EXAM_TIME_PRESETS,
  SECONDS_PER_QUESTION,
  suggestedMinutes,
  SPECIALTY_LABELS,
  EXAM_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  getQuestionTypeLabel,
} from '../../data/questionTypes';
import {
  loadLibrary,
  upsertLibraryItem,
  deleteLibraryItem,
  createLibraryItem,
  loadDocuments,
  saveDocuments,
  removeDocument,
  makeId,
  buildExamRun,
  isValidQuestion,
} from '../../lib/questionLibrary';
import { generateQuestions } from '../../services/questionGenerator';
import { processUploadedFile } from '../../utils/fileParser';
import { extractPdfText } from '../../utils/pdfText';
import { exportQuestions } from '../../lib/questionExport';
import { ExamRunner, ExamRunOutcome } from './ExamRunner';

interface ApiCredentials {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

interface QuestionBankTabProps {
  onResolveApiCredentials?: () => Promise<ApiCredentials>;
}

type SubView = 'generate' | 'library' | 'exam' | 'result';

const SUBJECT_SUGGESTIONS = [
  'Nội khoa',
  'Ngoại khoa',
  'Nhi khoa',
  'Sản - Phụ khoa',
  'Dược lý',
  'Giải phẫu',
  'Sinh lý',
  'Sinh lý bệnh',
  'Giải phẫu bệnh',
  'Chẩn đoán hình ảnh',
  'Xét nghiệm - Huyết học',
  'Y học cổ truyền',
  'Điều dưỡng',
];

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({ onResolveApiCredentials }) => {
  const [subView, setSubView] = useState<SubView>('generate');

  // ---------- Tài liệu ----------
  const [documents, setDocuments] = useState<StudyDocument[]>(() => loadDocuments());
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [docProgress, setDocProgress] = useState('');
  const [docError, setDocError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ---------- Cấu hình tạo đề ----------
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['best_answer', 'which_is_false', 'most_likely']);
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(suggestedMinutes(10));
  const [subject, setSubject] = useState('');
  const [specialty, setSpecialty] = useState<MedicalSpecialty>('internal');
  const [examCategory, setExamCategory] = useState<ExamCategory>('semester');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [title, setTitle] = useState('');

  // ---------- Quá trình sinh ----------
  const [isGenerating, setIsGenerating] = useState(false);
  const [genMessage, setGenMessage] = useState('');
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<{ note?: string; rejected: number; count: number } | null>(null);

  // ---------- Thư viện ----------
  const [library, setLibrary] = useState<QuestionLibraryItem[]>(() => loadLibrary());
  const [libraryQuery, setLibraryQuery] = useState('');
  const [librarySubjectFilter, setLibrarySubjectFilter] = useState('all');
  const [editingItem, setEditingItem] = useState<QuestionLibraryItem | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<MedicalQuestion | null>(null);
  const [viewingItem, setViewingItem] = useState<QuestionLibraryItem | null>(null);
  const [exportItem, setExportItem] = useState<QuestionLibraryItem | null>(null);

  // ---------- Làm bài ----------
  const [activeRun, setActiveRun] = useState<{
    item: QuestionLibraryItem;
    questions: MedicalQuestion[];
    durationSeconds: number;
  } | null>(null);
  const [runConfig, setRunConfig] = useState<{
    questionCount: number;
    durationMinutes: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    mode: 'study' | 'timed';
  }>({
    questionCount: 10,
    durationMinutes: 5,
    shuffleQuestions: true,
    shuffleOptions: true,
    mode: 'timed',
  });
  const [runSourceItem, setRunSourceItem] = useState<QuestionLibraryItem | null>(null);
  const [lastOutcome, setLastOutcome] = useState<{ item: QuestionLibraryItem; outcome: ExamRunOutcome } | null>(null);

  useEffect(() => {
    setLibrary(loadLibrary());
  }, []);

  // ==================== Tài liệu ====================

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;

    setIsParsingFiles(true);
    setDocError(null);
    setDocProgress('');

    const added: StudyDocument[] = [];
    const problems: string[] = [];

    for (const file of list) {
      try {
        const attachment = await processUploadedFile(file);
        let text = attachment.extractedText || '';

        // PDF trả về base64 -> cần trích văn bản riêng bằng PDF.js.
        if (!text && attachment.type === 'pdf') {
          const pdf = await extractPdfText(file, {
            onProgress: (done, total) => {
              if (total > 1) setDocProgress(`Đang đọc ${file.name}: trang ${done}/${total}`);
            },
          });

          if (!pdf.ok) {
            problems.push(`${file.name}: ${pdf.reason}`);
            continue;
          }

          text = pdf.text;

          // Trích được nhưng không đủ trang: thông báo mà không chặn tài liệu.
          if (pdf.reason) {
            problems.push(`${file.name}: ${pdf.reason}`);
          }
        }

        if (!text || text.trim().length < 200) {
          problems.push(`${file.name}: nội dung quá ngắn (dưới 200 ký tự) nên không đủ để soạn câu hỏi.`);
          continue;
        }

        added.push({
          id: makeId('doc'),
          name: file.name,
          size: file.size,
          extractedText: text,
          chars: text.length,
          addedAt: new Date().toISOString(),
        });
      } catch (err: any) {
        problems.push(`${file.name}: ${err?.message || 'không đọc được tệp'}`);
      }
    }

    if (added.length) {
      const next = saveDocuments([...added, ...documents]);
      setDocuments(next);
    }
    if (problems.length) setDocError(problems.join('\n'));
    setIsParsingFiles(false);
    setDocProgress('');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments(removeDocument(id));
  };

  // ==================== Sinh câu hỏi ====================

  const toggleType = (type: QuestionType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  /** Số câu và thời gian là hai lựa chọn độc lập. */
  const applyQuestionCount = (count: number) => {
    setQuestionCount(count);
    setDurationMinutes(suggestedMinutes(count));
  };

  const handleGenerate = async () => {
    if (!documents.length) {
      setGenError('Hãy tải lên ít nhất một tài liệu trước khi tạo câu hỏi.');
      return;
    }
    if (!selectedTypes.length) {
      setGenError('Chọn ít nhất một kiểu câu hỏi.');
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    setGenResult(null);
    setGenMessage('Đang chuẩn bị...');

    try {
      const credentials = onResolveApiCredentials ? await onResolveApiCredentials() : {};

      const result = await generateQuestions({
        documents,
        questionCount,
        questionTypes: selectedTypes,
        specialty,
        examCategory,
        difficulty,
        customApiKey: credentials.apiKey,
        customBaseUrl: credentials.baseUrl,
        model: credentials.model,
        onProgress: setGenMessage,
      });

      const item = createLibraryItem({
        title: title.trim() || `Bộ đề ${new Date().toLocaleDateString('vi-VN')} — ${documents[0].name}`,
        subject: subject.trim() || 'Chưa phân loại',
        specialty,
        examCategory,
        difficulty,
        sourceNames: documents.map((d) => d.name),
        questionTypes: selectedTypes,
        questions: result.questions,
      });

      const next = upsertLibraryItem(item);
      setLibrary(next);
      setGenResult({ note: result.note, rejected: result.rejected, count: result.questions.length });
      setGenMessage('');
    } catch (err: any) {
      setGenError(err?.message || 'Không tạo được câu hỏi.');
      setGenMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  // ==================== Thư viện ====================

  const filteredLibrary = useMemo(() => {
    return library.filter((item) => {
      const matchSubject = librarySubjectFilter === 'all' || item.subject === librarySubjectFilter;
      const q = libraryQuery.trim().toLowerCase();
      const matchQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        (SPECIALTY_LABELS[item.specialty] || '').toLowerCase().includes(q) ||
        item.questions.some((question) => question.question.toLowerCase().includes(q));
      return matchSubject && matchQuery;
    });
  }, [library, libraryQuery, librarySubjectFilter]);

  const allSubjects = useMemo(
    () => Array.from(new Set(library.map((item) => item.subject).filter(Boolean))),
    [library]
  );

  const handleDeleteItem = (item: QuestionLibraryItem) => {
    if (!window.confirm(`Xóa vĩnh viễn bộ đề "${item.title}" (${item.questions.length} câu)?`)) return;
    setLibrary(deleteLibraryItem(item.id));
  };

  const persistItem = (item: QuestionLibraryItem) => {
    const updated = { ...item, updatedAt: new Date().toISOString() };
    setLibrary(upsertLibraryItem(updated));
    return updated;
  };

  // ==================== Làm bài ====================

  const openRunSetup = (item: QuestionLibraryItem) => {
    setRunSourceItem(item);
    setRunConfig({
      questionCount: Math.min(item.questions.length, 10),
      durationMinutes: suggestedMinutes(Math.min(item.questions.length, 10)),
      shuffleQuestions: true,
      shuffleOptions: true,
      mode: 'timed',
    });
    setSubView('exam');
  };

  const startRun = () => {
    if (!runSourceItem) return;

    const questions = buildExamRun(runSourceItem.questions, {
      questionCount: runConfig.questionCount,
      shuffleQuestions: runConfig.shuffleQuestions,
      shuffleOptions: runConfig.shuffleOptions,
    });

    setActiveRun({
      item: runSourceItem,
      questions,
      durationSeconds: runConfig.mode === 'timed' ? runConfig.durationMinutes * 60 : 0,
    });
  };

  const finishRun = (outcome: ExamRunOutcome) => {
    if (!activeRun) return;

    // Trộn lại cho lượt sau: lần làm kế tiếp luôn xáo câu mới.
    const updated: QuestionLibraryItem = {
      ...activeRun.item,
      attemptCount: (activeRun.item.attemptCount || 0) + 1,
      bestScore:
        activeRun.item.bestScore === undefined
          ? outcome.correctCount
          : Math.max(activeRun.item.bestScore, outcome.correctCount),
      updatedAt: new Date().toISOString(),
    };
    setLibrary(upsertLibraryItem(updated));

    setLastOutcome({ item: updated, outcome });
    setActiveRun(null);
    setSubView('result');
  };

  const restartRun = () => {
    setRunSourceItem(activeRun?.item ?? lastOutcome?.item ?? null);
    setActiveRun(null);
    setSubView('exam');
  };

  // ==================== Chỉnh sửa ====================

  const saveQuestionEdit = () => {
    if (!editingItem || !editingQuestion) return;
    if (!isValidQuestion(editingQuestion)) {
      window.alert('Câu hỏi chưa hợp lệ: cần nội dung, ít nhất 2 đáp án và chỉ số đáp án đúng trong phạm vi.');
      return;
    }

    const questions = editingItem.questions.some((q) => q.id === editingQuestion.id)
      ? editingItem.questions.map((q) => (q.id === editingQuestion.id ? editingQuestion : q))
      : [...editingItem.questions, editingQuestion];

    const updated = persistItem({ ...editingItem, questions });
    setEditingItem(updated);
    setEditingQuestion(null);
  };

  const deleteQuestion = (questionId: string) => {
    if (!editingItem) return;
    if (!window.confirm('Xóa câu hỏi này khỏi bộ đề?')) return;
    const questions = editingItem.questions.filter((q) => q.id !== questionId);
    if (!questions.length) {
      window.alert('Bộ đề phải còn ít nhất một câu. Hãy xóa cả bộ đề nếu không cần nữa.');
      return;
    }
    const updated = persistItem({ ...editingItem, questions });
    setEditingItem(updated);
  };

  const addBlankQuestion = () => {
    if (!editingItem) return;
    const blank: MedicalQuestion = {
      id: makeId('gen'),
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      specialty: editingItem.specialty,
      examCategory: editingItem.examCategory,
      difficulty: editingItem.difficulty,
      reference: '',
      questionType: 'best_answer',
      sourceName: editingItem.sourceNames[0],
    };
    setEditingQuestion(blank);
  };

  // ==================== Render ====================

  const renderGenerate = () => (
    <div className="space-y-4">
      {/* Tài liệu */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
            <FolderOpen size={15} className="text-emerald-600" />
            Tài liệu học tập
          </h4>
          <span className="text-[14px] text-stone-500">{documents.length} tệp</span>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/5'
              : 'border-stone-300 dark:border-stone-700 hover:border-emerald-400 hover:bg-stone-50 dark:hover:bg-stone-850'
          }`}
        >
          {isParsingFiles ? (
            <div className="flex flex-col items-center gap-2 text-emerald-600">
              <Loader2 size={22} className="animate-spin" />
              <p className="text-xs font-semibold">{docProgress || 'Đang đọc tài liệu...'}</p>
            </div>
          ) : (
            <>
              <Upload size={22} className="mx-auto text-stone-400 mb-2" />
              <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">
                Kéo thả tài liệu vào đây hoặc bấm để chọn
              </p>
              <p className="text-[14px] text-stone-500 mt-1">
                PDF (có lớp văn bản), Word, PowerPoint, Excel, TXT, Markdown
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {docError && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[14px] text-amber-800 dark:text-amber-300 whitespace-pre-line">
            <div className="flex items-start gap-1.5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{docError}</span>
            </div>
          </div>
        )}

        {documents.length > 0 && (
          <div className="space-y-1.5">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800"
              >
                <FileText size={14} className="text-emerald-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-stone-800 dark:text-stone-200 truncate">
                    {doc.name}
                  </p>
                  <p className="text-[13px] text-stone-500">
                    {doc.chars.toLocaleString('vi-VN')} ký tự
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveDoc(doc.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Bỏ tài liệu"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kiểu câu hỏi */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
          <ListChecks size={15} className="text-emerald-600" />
          Kiểu câu hỏi cần tạo
          <span className="ml-auto text-[13px] font-normal text-stone-500">
            Đã chọn {selectedTypes.length}
          </span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUESTION_TYPES.map((type) => {
            const active = selectedTypes.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => toggleType(type.id)}
                className={`text-left p-2.5 rounded-xl border transition-all ${
                  active
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {active ? (
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-stone-300 dark:border-stone-600 shrink-0" />
                  )}
                  <span className="text-[14px] font-bold text-stone-800 dark:text-stone-200">
                    {type.label}
                  </span>
                </div>
                <p className="text-[13px] text-stone-500 mt-1 leading-snug pl-4.5">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thông tin bộ đề */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
        <h4 className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
          <Settings2 size={15} className="text-emerald-600" />
          Thông tin bộ đề
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <label className="space-y-1">
            <span className="text-[14px] font-semibold text-stone-500">Tên bộ đề (tuỳ chọn)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đề ôn Tim mạch - Chương Suy tim"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[14px] font-semibold text-stone-500">Môn học</span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              list="auramed-subject-suggestions"
              placeholder="VD: Nội khoa"
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <datalist id="auramed-subject-suggestions">
              {SUBJECT_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </label>

          <label className="space-y-1">
            <span className="text-[14px] font-semibold text-stone-500">Chuyên khoa</span>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as MedicalSpecialty)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              {Object.entries(SPECIALTY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[14px] font-semibold text-stone-500">Mục tiêu kỳ thi</span>
            <select
              value={examCategory}
              onChange={(e) => setExamCategory(e.target.value as ExamCategory)}
              className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
            >
              {Object.entries(EXAM_CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-stone-500">Số câu hỏi</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={200}
                value={questionCount}
                onChange={(e) => applyQuestionCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
                className="w-20 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
              />
              <div className="flex gap-1">
                {[10, 15, 20, 30, 60].map((n) => (
                  <button
                    key={n}
                    onClick={() => applyQuestionCount(n)}
                    className={`px-2 py-1.5 rounded-lg text-[13px] font-bold transition-colors ${
                      questionCount === n
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[14px] font-semibold text-stone-500">
              Thời gian làm bài (phút) — tách riêng với số câu
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, Math.min(300, Number(e.target.value) || 1)))}
                className="w-20 px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
              />
              <span className="text-[13px] text-stone-500">
                ≈ {Math.round((durationMinutes * 60) / Math.max(1, questionCount))} giây/câu
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {EXAM_TIME_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setQuestionCount(preset.questionCount);
                setDurationMinutes(preset.minutes);
              }}
              className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <label className="space-y-1 block pt-1">
          <span className="text-[14px] font-semibold text-stone-500">Độ khó</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
            className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
          >
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Cảnh báo chống bịa */}
      <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-[14px] text-blue-800 dark:text-blue-300">
        <div className="flex items-start gap-1.5">
          <Sparkles size={14} className="shrink-0 mt-0.5" />
          <p>
            AI chỉ soạn câu hỏi từ nội dung tài liệu bạn tải lên. Mỗi câu phải kèm trích dẫn nguyên văn;
            câu nào không đối chiếu được với tài liệu sẽ tự động bị loại, nên số câu tạo ra có thể ít hơn
            yêu cầu.
          </p>
        </div>
      </div>

      {genError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[14px] text-rose-700 dark:text-rose-300 whitespace-pre-line">
          {genError}
        </div>
      )}

      {genResult && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[14px] text-emerald-800 dark:text-emerald-300 space-y-1">
          <p className="font-bold">
            Đã tạo {genResult.count} câu và lưu vào Thư viện câu hỏi.
          </p>
          {genResult.rejected > 0 && <p>{genResult.rejected} câu bị loại khi kiểm chứng.</p>}
          {genResult.note && <p className="opacity-80">{genResult.note}</p>}
          <button
            onClick={() => setSubView('library')}
            className="mt-1 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold underline"
          >
            Mở thư viện <ChevronRight size={12} />
          </button>
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !documents.length || !selectedTypes.length}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-sm transition-all"
      >
        {isGenerating ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>{genMessage || 'Đang tạo câu hỏi...'}</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Tạo {questionCount} câu hỏi từ tài liệu</span>
          </>
        )}
      </button>
    </div>
  );

  const renderLibrary = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={libraryQuery}
            onChange={(e) => setLibraryQuery(e.target.value)}
            placeholder="Tìm bộ đề, môn học, nội dung câu hỏi..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        <select
          value={librarySubjectFilter}
          onChange={(e) => setLibrarySubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
        >
          <option value="all">Tất cả môn ({library.length})</option>
          {allSubjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button
          onClick={() => setSubView('generate')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
        >
          <Plus size={14} />
          Tạo bộ đề
        </button>
      </div>

      {!filteredLibrary.length ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-stone-900 border border-dashed border-stone-300 dark:border-stone-700">
          <BookOpen size={26} className="mx-auto text-stone-300 dark:text-stone-600 mb-2" />
          <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
            {library.length ? 'Không có bộ đề nào khớp từ khóa.' : 'Thư viện câu hỏi đang trống.'}
          </p>
          <p className="text-[14px] text-stone-500 mt-1">
            Tạo bộ đề từ tài liệu — câu hỏi được lưu vĩnh viễn cho đến khi bạn xóa.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLibrary.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-400/60 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {item.title}
                  </h5>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[13px] font-bold">
                      {item.subject}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[13px]">
                      {item.questions.length} câu
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[13px]">
                      {SPECIALTY_LABELS[item.specialty] || item.specialty}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[13px]">
                      Đã làm {item.attemptCount} lần
                    </span>
                    {item.bestScore !== undefined && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[13px] font-bold inline-flex items-center gap-0.5">
                        <Award size={9} />
                        Cao nhất {item.bestScore}/{item.questions.length}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-stone-400 mt-1.5 truncate">
                    Nguồn: {item.sourceNames.join(', ') || 'không rõ'} · Cập nhật{' '}
                    {new Date(item.updatedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteItem(item)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                  title="Xóa bộ đề"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-stone-100 dark:border-stone-800">
                <button
                  onClick={() => openRunSetup(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold transition-colors"
                >
                  <Timer size={11} />
                  Làm bài
                </button>
                <button
                  onClick={() => setViewingItem(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-[13px] font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <Eye size={11} />
                  Xem
                </button>
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setEditingQuestion(null);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-[13px] font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <Pencil size={11} />
                  Sửa
                </button>
                <button
                  onClick={() => setExportItem(item)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-[13px] font-semibold hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <Download size={11} />
                  Tải về
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExamSetup = () => {
    if (!runSourceItem) return null;
    const maxCount = runSourceItem.questions.length;
    const count = Math.min(runConfig.questionCount, maxCount);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubView('library')}
            className="text-[14px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
          >
            <ChevronRight size={12} className="rotate-180" />
            Thư viện
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-3">
          <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">{runSourceItem.title}</h4>
          <p className="text-[14px] text-stone-500">
            Bộ đề có {maxCount} câu. Số câu làm bài và thời gian là hai lựa chọn độc lập.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[14px] font-semibold text-stone-500">Số câu làm bài</span>
              <input
                type="number"
                min={1}
                max={maxCount}
                value={count}
                onChange={(e) =>
                  setRunConfig((prev) => ({
                    ...prev,
                    questionCount: Math.max(1, Math.min(maxCount, Number(e.target.value) || 1)),
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-[14px] font-semibold text-stone-500">Thời gian (phút)</span>
              <input
                type="number"
                min={1}
                max={300}
                value={runConfig.durationMinutes}
                onChange={(e) =>
                  setRunConfig((prev) => ({
                    ...prev,
                    durationMinutes: Math.max(1, Math.min(300, Number(e.target.value) || 1)),
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 focus:outline-none"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {EXAM_TIME_PRESETS.filter((p) => p.questionCount <= maxCount).map((preset) => (
              <button
                key={preset.label}
                onClick={() =>
                  setRunConfig((prev) => ({
                    ...prev,
                    questionCount: preset.questionCount,
                    durationMinutes: preset.minutes,
                  }))
                }
                className="px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-[13px] font-medium text-stone-600 dark:text-stone-300 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={() =>
                setRunConfig((prev) => ({
                  ...prev,
                  questionCount: maxCount,
                  durationMinutes: Math.max(1, Math.ceil((maxCount * SECONDS_PER_QUESTION) / 60)),
                }))
              }
              className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[13px] font-bold"
            >
              Mặc định 1 câu/30 giây
            </button>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => setRunConfig((prev) => ({ ...prev, mode: 'timed' }))}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                runConfig.mode === 'timed'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              <Timer size={15} className={runConfig.mode === 'timed' ? 'text-emerald-600' : 'text-stone-400'} />
              <div>
                <p className="text-[14px] font-bold text-stone-800 dark:text-stone-200">Thi có tính giờ</p>
                <p className="text-[13px] text-stone-500">Hết giờ tự động nộp bài</p>
              </div>
            </button>

            <button
              onClick={() => setRunConfig((prev) => ({ ...prev, mode: 'study' }))}
              className={`w-full flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                runConfig.mode === 'study'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-stone-200 dark:border-stone-800'
              }`}
            >
              <Clock size={15} className={runConfig.mode === 'study' ? 'text-emerald-600' : 'text-stone-400'} />
              <div>
                <p className="text-[14px] font-bold text-stone-800 dark:text-stone-200">Học tập, không giới hạn</p>
                <p className="text-[13px] text-stone-500">Tự do suy nghĩ, vẫn có giải thích từng câu</p>
              </div>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[14px] font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={runConfig.shuffleQuestions}
                onChange={(e) => setRunConfig((prev) => ({ ...prev, shuffleQuestions: e.target.checked }))}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Shuffle size={12} />
              Trộn thứ tự câu hỏi
            </label>
            <label className="flex items-center gap-2 text-[14px] font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
              <input
                type="checkbox"
                checked={runConfig.shuffleOptions}
                onChange={(e) => setRunConfig((prev) => ({ ...prev, shuffleOptions: e.target.checked }))}
                className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Shuffle size={12} />
              Trộn thứ tự đáp án
            </label>
          </div>

          <button
            onClick={startRun}
            className="w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
          >
            Bắt đầu làm bài ({count} câu · {runConfig.mode === 'timed' ? `${runConfig.durationMinutes} phút` : 'không giới hạn'})
          </button>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!lastOutcome) return null;
    const { item, outcome } = lastOutcome;
    const percent = Math.round((outcome.correctCount / Math.max(1, outcome.questionCount)) * 100);
    const passed = percent >= 50;

    return (
      <div className="space-y-4">
        <div
          className={`p-5 rounded-2xl border text-center ${
            passed
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}
        >
          <Award size={28} className={`mx-auto mb-2 ${passed ? 'text-emerald-600' : 'text-rose-500'}`} />
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100">
            {outcome.correctCount}/{outcome.questionCount}
          </p>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Đạt {percent}% · {Math.floor(outcome.timeSpentSeconds / 60)} phút{' '}
            {outcome.timeSpentSeconds % 60} giây
            {outcome.timedOut && ' · hết giờ'}
          </p>
          <p className="text-[14px] text-stone-500 mt-2">{item.title}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setRunSourceItem(item);
              setSubView('exam');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
          >
            <RotateCcw size={14} />
            Làm lại (trộn đề mới)
          </button>
          <button
            onClick={() => {
              setViewingItem(item);
              setSubView('library');
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold transition-colors"
          >
            <BookOpen size={14} />
            Về thư viện
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Thanh chuyển mục con */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/60">
        <button
          onClick={() => setSubView('generate')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[14px] font-bold transition-all ${
            subView === 'generate'
              ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <Sparkles size={13} />
          Tạo từ tài liệu
        </button>
        <button
          onClick={() => setSubView('library')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[14px] font-bold transition-all ${
            subView === 'library'
              ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-stone-600 dark:text-stone-400'
          }`}
        >
          <BookOpen size={13} />
          Thư viện ({library.length})
        </button>
        {(subView === 'exam' || subView === 'result') && (
          <span className="px-3 py-2 text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
            {subView === 'exam' ? 'Làm bài' : 'Kết quả'}
          </span>
        )}
      </div>

      {subView === 'generate' && renderGenerate()}
      {subView === 'library' && renderLibrary()}

      {subView === 'exam' &&
        (activeRun ? (
          <ExamRunner
            questions={activeRun.questions}
            durationSeconds={activeRun.durationSeconds}
            title={activeRun.item.title}
            onFinish={finishRun}
            onExit={() => {
              setActiveRun(null);
              setSubView('library');
            }}
            onRestart={restartRun}
          />
        ) : (
          renderExamSetup()
        ))}

      {subView === 'result' && renderResult()}

      {/* Modal xem bộ đề */}
      {viewingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {viewingItem.title}
              </h4>
              <button
                onClick={() => setViewingItem(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {viewingItem.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800 space-y-1.5"
                >
                  <p className="text-[14px] font-bold text-stone-900 dark:text-stone-100">
                    Câu {idx + 1}. {q.question}
                  </p>
                  <p className="text-[13px] text-stone-400">{getQuestionTypeLabel(q.questionType)}</p>
                  <ul className="space-y-0.5 pl-1">
                    {q.options.map((opt, i) => (
                      <li
                        key={i}
                        className={`text-[14px] ${
                          i === q.correctIndex
                            ? 'text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-stone-600 dark:text-stone-400'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[14px] text-stone-600 dark:text-stone-400">
                    <strong>Giải thích:</strong> {q.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa bộ đề */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  Chỉnh sửa: {editingItem.title}
                </h4>
                <p className="text-[13px] text-stone-500">{editingItem.questions.length} câu hỏi</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={addBlankQuestion}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold"
                >
                  <Plus size={11} />
                  Thêm câu
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setEditingQuestion(null);
                  }}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {editingItem.questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="flex items-start gap-2 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200/70 dark:border-stone-800"
                >
                  <span className="text-[13px] font-bold text-stone-400 mt-0.5 shrink-0">{idx + 1}.</span>
                  <p className="flex-1 text-[14px] text-stone-700 dark:text-stone-300 line-clamp-2">
                    {q.question || '(câu hỏi trống)'}
                  </p>
                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="p-1 rounded text-stone-400 hover:text-emerald-600 shrink-0"
                    title="Sửa câu này"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1 rounded text-stone-400 hover:text-rose-500 shrink-0"
                    title="Xóa câu này"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa một câu hỏi */}
      {editingQuestion && editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Sửa câu hỏi</h4>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 text-xs">
              <label className="block space-y-1">
                <span className="text-[14px] font-semibold text-stone-500">Nội dung câu hỏi</span>
                <textarea
                  value={editingQuestion.question}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[14px] font-semibold text-stone-500">Tình huống (tuỳ chọn)</span>
                <textarea
                  value={editingQuestion.vignette || ''}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, vignette: e.target.value || undefined })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                />
              </label>

              {editingQuestion.options.map((opt, i) => (
                <label key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={editingQuestion.correctIndex === i}
                    onChange={() => setEditingQuestion({ ...editingQuestion, correctIndex: i })}
                    className="text-emerald-600"
                    title="Đánh dấu là đáp án đúng"
                  />
                  <span className="text-[14px] font-bold text-stone-500 w-4">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => {
                      const optionsCopy = [...editingQuestion.options];
                      optionsCopy[i] = e.target.value;
                      setEditingQuestion({ ...editingQuestion, options: optionsCopy });
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  />
                </label>
              ))}

              <label className="block space-y-1">
                <span className="text-[14px] font-semibold text-stone-500">Giải thích đáp án</span>
                <textarea
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[14px] font-semibold text-stone-500">Kiểu câu hỏi</span>
                <select
                  value={editingQuestion.questionType || 'best_answer'}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, questionType: e.target.value as QuestionType })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-850 border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveQuestionEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  <Save size={13} />
                  Lưu câu hỏi
                </button>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 text-xs font-bold"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal tải về */}
      {exportItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-3">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Tải bộ đề về máy</h4>
              <button
                onClick={() => setExportItem(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[14px] text-stone-500 truncate">{exportItem.title}</p>
            <div className="grid grid-cols-3 gap-2">
              {(['pdf', 'docx', 'md'] as const).map((format) => (
                <button
                  key={format}
                  onClick={async () => {
                    try {
                      await exportQuestions(exportItem, format, true);
                      setExportItem(null);
                    } catch (err: any) {
                      window.alert(`Không xuất được ${format.toUpperCase()}: ${err?.message || 'lỗi không xác định'}`);
                    }
                  }}
                  className="px-3 py-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400 text-stone-700 dark:text-stone-200 text-[14px] font-bold transition-colors"
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[13px] text-stone-400">
              File xuất kèm đáp án và giải thích. PDF dùng font hệ thống nên giữ đúng dấu tiếng Việt.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
