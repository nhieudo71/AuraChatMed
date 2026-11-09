import { MedicalQuestion, QuestionLibraryItem, StudyDocument } from '../types/medical';

const KEY_LIBRARY = 'auramed_question_library_v1';
const KEY_DOCS = 'auramed_study_documents_v1';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  return safeParse<T>(localStorage.getItem(key), fallback);
}

function writeJson(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Không ghi được dữ liệu vào localStorage:', err);
    throw new Error('Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt bộ đề cũ rồi thử lại.');
  }
}

export function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ===================== Thư viện câu hỏi =====================

export function loadLibrary(): QuestionLibraryItem[] {
  const items = readJson<QuestionLibraryItem[]>(KEY_LIBRARY, []);
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && typeof item.id === 'string' && Array.isArray(item.questions))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export function saveLibrary(items: QuestionLibraryItem[]): void {
  writeJson(KEY_LIBRARY, items);
}

export function upsertLibraryItem(item: QuestionLibraryItem): QuestionLibraryItem[] {
  const current = loadLibrary();
  const index = current.findIndex((entry) => entry.id === item.id);
  const next =
    index >= 0
      ? current.map((entry, i) => (i === index ? item : entry))
      : [item, ...current];
  saveLibrary(next);
  return next;
}

export function deleteLibraryItem(id: string): QuestionLibraryItem[] {
  const next = loadLibrary().filter((entry) => entry.id !== id);
  saveLibrary(next);
  return next;
}

export function getLibraryItem(id: string): QuestionLibraryItem | undefined {
  return loadLibrary().find((entry) => entry.id === id);
}

export function createLibraryItem(
  partial: Omit<QuestionLibraryItem, 'id' | 'createdAt' | 'updatedAt' | 'attemptCount'>
): QuestionLibraryItem {
  const now = new Date().toISOString();
  return {
    ...partial,
    id: makeId('lib'),
    createdAt: now,
    updatedAt: now,
    attemptCount: 0,
  };
}

/** Thống kê nhanh cho giao diện thư viện. */
export function summarizeLibrary(items: QuestionLibraryItem[]) {
  const totalQuestions = items.reduce((sum, item) => sum + item.questions.length, 0);
  const subjects = Array.from(new Set(items.map((item) => item.subject).filter(Boolean)));
  const questionTypes = Array.from(
    new Set(items.flatMap((item) => item.questionTypes || []))
  );
  return { totalItems: items.length, totalQuestions, subjects, questionTypes };
}

// ===================== Tài liệu học tập =====================

/**
 * Tài liệu được lưu tạm trong phiên làm việc (localStorage) để có thể sinh
 * thêm câu hỏi mà không phải tải lại. Giới hạn tổng dung lượng để không làm
 * hỏng bộ nhớ trình duyệt.
 */
const MAX_DOC_CHARS_TOTAL = 6_000_000;

export function loadDocuments(): StudyDocument[] {
  const docs = readJson<StudyDocument[]>(KEY_DOCS, []);
  return Array.isArray(docs) ? docs.filter((d) => d && typeof d.id === 'string') : [];
}

export function saveDocuments(docs: StudyDocument[]): StudyDocument[] {
  let total = 0;
  const kept: StudyDocument[] = [];
  // Giữ tài liệu mới nhất trước, bỏ tài liệu cũ nếu vượt hạn mức.
  for (const doc of [...docs].sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || ''))) {
    total += doc.extractedText.length;
    if (total > MAX_DOC_CHARS_TOTAL) break;
    kept.push(doc);
  }
  writeJson(KEY_DOCS, kept);
  return kept;
}

export function removeDocument(id: string): StudyDocument[] {
  const next = loadDocuments().filter((doc) => doc.id !== id);
  writeJson(KEY_DOCS, next);
  return next;
}

// ===================== Chuẩn hóa câu hỏi =====================

/**
 * Trộn mảng bằng Fisher-Yates. Trả về mảng mới, không sửa mảng gốc.
 */
export function shuffleArray<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Trộn đáp án và cập nhật lại `correctIndex` tương ứng.
 * `correctIndex` là chỉ số của đáp án đúng TRƯỚC khi trộn.
 */
export function shuffleOptions(question: MedicalQuestion): MedicalQuestion {
  const indexed = question.options.map((text, originalIndex) => ({ text, originalIndex }));
  const shuffled = shuffleArray(indexed);
  const newCorrectIndex = shuffled.findIndex((item) => item.originalIndex === question.correctIndex);

  return {
    ...question,
    options: shuffled.map((item) => item.text),
    correctIndex: newCorrectIndex >= 0 ? newCorrectIndex : question.correctIndex,
  };
}

/** Chuẩn bị một lượt làm bài: cắt số câu, trộn câu và trộn đáp án. */
export function buildExamRun(
  questions: MedicalQuestion[],
  options: { questionCount: number; shuffleQuestions: boolean; shuffleOptions: boolean }
): MedicalQuestion[] {
  let picked = [...questions];

  if (options.shuffleQuestions) {
    picked = shuffleArray(picked);
  }
  picked = picked.slice(0, Math.max(1, options.questionCount));

  if (options.shuffleOptions) {
    picked = picked.map(shuffleOptions);
  }

  return picked;
}

/**
 * Kiểm tra cấu trúc câu hỏi do AI trả về.
 * Dùng để chặn câu hỏi hỏng trước khi đưa vào thư viện.
 */
export function isValidQuestion(value: unknown): value is MedicalQuestion {
  if (!value || typeof value !== 'object') return false;
  const q = value as Partial<MedicalQuestion>;

  if (typeof q.question !== 'string' || q.question.trim().length < 5) return false;
  if (!Array.isArray(q.options) || q.options.length < 2) return false;
  if (!q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0)) return false;
  if (typeof q.correctIndex !== 'number') return false;
  if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return false;
  if (typeof q.explanation !== 'string' || q.explanation.trim().length < 5) return false;

  return true;
}
