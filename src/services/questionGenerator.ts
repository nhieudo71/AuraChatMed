import { MedicalQuestion, QuestionType, StudyDocument } from '../types/medical';
import { QUESTION_TYPE_MAP } from '../data/questionTypes';
import { isValidQuestion } from '../lib/questionLibrary';

/** Giới hạn ký tự tài liệu đưa vào một lượt sinh câu hỏi. */
export const MAX_DOC_CHARS_PER_REQUEST = 60_000;

/** Số câu tối đa cho một lượt sinh (tránh response quá dài bị cắt). */
export const MAX_QUESTIONS_PER_REQUEST = 25;

export interface GenerateOptions {
  documents: StudyDocument[];
  questionCount: number;
  questionTypes: QuestionType[];
  specialty: string;
  examCategory: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language?: 'vi' | 'en';
  /** Khóa API tùy chỉnh đã giải mã (nếu người dùng cấu hình provider riêng). */
  customApiKey?: string;
  customBaseUrl?: string;
  model?: string;
  signal?: AbortSignal;
  onProgress?: (message: string) => void;
}

/**
 * Prompt được thiết kế để CHỐNG BỊA.
 *
 * Nguyên tắc cốt lõi: mọi câu hỏi, đáp án và giải thích phải truy nguyên được
 * về một đoạn trong tài liệu. AI buộc phải trích dẫn nguyên văn đoạn nguồn.
 * Nếu tài liệu không đủ nội dung, AI phải trả về ít câu hơn thay vì bịa thêm.
 */
function buildGenerationPrompt(options: GenerateOptions, docText: string, docNames: string[]): string {
  const typeInstructions = options.questionTypes
    .map((type, idx) => `${idx + 1}. ${QUESTION_TYPE_MAP[type].label}: ${QUESTION_TYPE_MAP[type].instruction}`)
    .join('\n');

  return `Bạn là chuyên gia soạn đề thi y khoa. Nhiệm vụ: tạo câu hỏi trắc nghiệm CHỈ từ tài liệu được cung cấp.

=== QUY TẮC BẮT BUỘC (vi phạm = kết quả bị loại) ===
1. CHỈ dùng thông tin có trong phần TÀI LIỆU bên dưới. Tuyệt đối không dùng kiến thức bên ngoài.
2. Mỗi câu hỏi phải có trường "sourceQuote": trích NGUYÊN VĂN một đoạn ngắn (10-40 từ) trong tài liệu chứa đáp án. Đoạn trích phải tồn tại đúng từng chữ trong tài liệu.
3. Nếu tài liệu không đủ nội dung để tạo đủ ${options.questionCount} câu, hãy tạo ÍT HƠN và ghi rõ trong "note". KHÔNG được bịa để đủ số lượng.
4. Mỗi câu có ĐÚNG 4 phương án, chỉ 1 phương án đúng.
5. "explanation" phải giải thích vì sao đáp án đúng và vì sao các phương án khác sai, dựa trên tài liệu.
6. Không tạo câu hỏi về thông tin không xuất hiện trong tài liệu (không hỏi về tác giả, số trang, metadata).
7. Ngôn ngữ: ${options.language === 'en' ? 'English' : 'tiếng Việt'}.

=== KIỂU CÂU HỎI CẦN TẠO ===
${typeInstructions}

Phân bổ đều các kiểu trên cho ${options.questionCount} câu.

=== THÔNG TIN BỘ ĐỀ ===
- Chuyên khoa: ${options.specialty}
- Mục tiêu kỳ thi: ${options.examCategory}
- Độ khó: ${options.difficulty}
- Số câu cần tạo: ${options.questionCount}

=== ĐỊNH DẠNG ĐẦU RA ===
Chỉ trả về MỘT mảng JSON hợp lệ, không kèm markdown, không kèm giải thích ngoài mảng:
[
  {
    "questionType": "best_answer",
    "vignette": "Tình huống lâm sàng ngắn (bỏ trống nếu không phù hợp)",
    "question": "Nội dung câu hỏi",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0,
    "explanation": "Giải thích chi tiết dựa trên tài liệu",
    "sourceQuote": "Đoạn trích nguyên văn từ tài liệu",
    "sourceName": "Tên tài liệu chứa đoạn trích"
  }
]

"questionType" phải là một trong: ${options.questionTypes.join(', ')}.

=== TÀI LIỆU (${docNames.join(', ')}) ===
${docText}
=== HẾT TÀI LIỆU ===

Tạo tối đa ${options.questionCount} câu hỏi từ tài liệu trên.`;
}

/**
 * Gọi endpoint SSE có sẵn để lấy toàn bộ văn bản trả về.
 * Không dùng trực tiếp SDK vì endpoint đã xử lý sẵn khóa API và chế độ model.
 */
async function streamCompletion(prompt: string, options: GenerateOptions): Promise<string> {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: options.signal,
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: '',
      model: options.model,
      thinkingMode: false,
      speedMode: true,
      customApiKey: options.customApiKey,
      customBaseUrl: options.customBaseUrl,
      responseStyle: 'detailed',
    }),
  });

  if (!response.ok) {
    throw new Error(`Máy chủ AI trả về lỗi ${response.status}. Kiểm tra kết nối rồi thử lại.`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Không đọc được luồng phản hồi từ máy chủ.');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let text = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') continue;

      try {
        const data = JSON.parse(payload);
        if (data.error) throw new Error(String(data.error));
        if (data.text) text += data.text;
      } catch (err) {
        if (err instanceof Error && err.message && !err.message.includes('JSON')) throw err;
      }
    }
  }

  if (!text.trim()) throw new Error('AI không trả về nội dung. Thử lại hoặc kiểm tra khóa API.');
  return text;
}

/**
 * Trích mảng JSON từ phản hồi AI, chịu được cả phản hồi bị cắt giữa chừng.
 *
 * Vì sao cần: model thường chạm giới hạn token đầu ra nên mảng bị cụt — câu
 * cuối cùng đứt giữa chừng, hoặc lời dẫn phía sau chứa dấu `]` khiến việc cắt
 * theo `lastIndexOf(']')` lấy nhầm vị trí. Cách làm ở đây là quét từng ký tự
 * trong khi vẫn theo dõi trạng thái chuỗi và escape, rồi thu các object ở cấp
 * ngoài cùng. Object nào đóng đủ ngoặc mới được giữ, phần cụt bị bỏ — nhờ vậy
 * một lượt sinh bị cắt vẫn dùng được các câu hoàn chỉnh thay vì mất trắng.
 */
export function extractJsonArray(raw: string): any[] {
  // 1. Bỏ rào markdown nếu có
  const cleaned = raw.replace(/```json/gi, '```').replace(/```/g, '\n');

  const start = cleaned.indexOf('[');
  if (start === -1) {
    throw new Error('Không tìm thấy mảng JSON trong phản hồi của AI.');
  }

  // 2. Thử parse nguyên khối trước — nhanh và chính xác nhất khi JSON lành.
  const end = cleaned.lastIndexOf(']');
  if (end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* rơi xuống nhánh quét */
    }
  }

  // 3. Quét thủ công: chỉ giữ các object cấp ngoài cùng đã đóng đủ ngoặc.
  //    Object bị đứt giữa chừng (do chạm giới hạn token) bị bỏ — thà mất câu
  //    cuối còn hơn nhét vào một câu hỏi rác.
  const objects = scanTopLevelObjects(cleaned, start);
  if (!objects.length) {
    throw new Error(
      'Phản hồi của AI bị cắt trước khi có câu hỏi hoàn chỉnh. Hãy giảm số câu mỗi lượt hoặc chọn model có giới hạn đầu ra lớn hơn.'
    );
  }

  const recovered: any[] = [];
  for (const chunk of objects) {
    for (const attempt of [chunk, repairJsonArray(chunk)]) {
      try {
        const obj = JSON.parse(attempt);
        if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
          recovered.push(obj);
          break;
        }
      } catch {
        /* thử bản đã vá */
      }
    }
  }

  if (!recovered.length) {
    throw new Error('Không đọc được câu hỏi nào từ phản hồi của AI (JSON bị hỏng hoặc bị cắt).');
  }
  return recovered;
}

/**
 * Sửa các lỗi cú pháp phổ biến của model: dấu phẩy thừa trước `]`/`}`,
 * ký tự xuống dòng chưa escape bên trong chuỗi, và mảng bị cụt.
 */
function repairJsonArray(text: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  // Ngăn xếp theo dõi ngoặc đang mở để biết phải đóng những gì khi cụt.
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '"') {
        out += ch;
        inString = false;
        continue;
      }
      // Ký tự điều khiển thô bên trong chuỗi làm JSON.parse vỡ.
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') {
        out += '\\r';
        continue;
      }
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      out += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === '{' || ch === '[') {
      stack.push(ch);
      out += ch;
      continue;
    }
    if (ch === '}' || ch === ']') {
      // Bỏ dấu phẩy thừa ngay trước ngoặc đóng.
      out = out.replace(/,\s*$/, '');
      stack.pop();
      out += ch;
      continue;
    }
    out += ch;
  }

  if (inString) out += '"'; // chuỗi bị đứt

  // Đóng những ngoặc còn mở, theo thứ tự ngược.
  while (stack.length) {
    const open = stack.pop();
    out = out.replace(/,\s*$/, '');
    out += open === '{' ? '}' : ']';
  }

  return out;
}

/**
 * Quét văn bản và trả về nguyên văn từng object `{...}` ở cấp ngoài cùng của
 * mảng. Bỏ qua nội dung trong chuỗi để ngoặc trong câu hỏi không làm lệch đếm.
 */
function scanTopLevelObjects(text: string, arrayStart: number): string[] {
  const results: string[] = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let objStart = -1;
  // Độ sâu ngoặc tại thời điểm bắt đầu object hiện tại.
  let objBaseDepth = 0;

  for (let i = arrayStart; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '[' || ch === '{') {
      if (ch === '{' && depth === 1 && objStart === -1) {
        objStart = i;
        objBaseDepth = depth;
      }
      depth++;
      continue;
    }

    if (ch === ']' || ch === '}') {
      depth--;
      if (ch === '}' && objStart !== -1 && depth === objBaseDepth) {
        results.push(text.slice(objStart, i + 1));
        objStart = -1;
      }
      if (depth <= 0) break; // mảng đã đóng
      continue;
    }
  }

  return results;
}

/**
 * Đối chiếu `sourceQuote` với tài liệu gốc.
 * Đây là chốt chặn chống bịa: câu hỏi không có trích dẫn khớp sẽ bị loại.
 */
export function verifySourceQuote(quote: string | undefined, documentText: string): boolean {
  if (!quote || quote.trim().length < 8) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[“”"'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const haystack = normalize(documentText);
  const needle = normalize(quote);

  if (haystack.includes(needle)) return true;

  // Nới lỏng: so khớp 80% ký tự đầu của đoạn trích (AI có thể đổi dấu câu)
  const partial = needle.slice(0, Math.max(20, Math.floor(needle.length * 0.8)));
  return partial.length > 0 && haystack.includes(partial);
}

function normalizeQuestion(
  raw: any,
  options: GenerateOptions,
  fallbackType: QuestionType,
  sourceNames: string[]
): MedicalQuestion | null {
  const options_arr = Array.isArray(raw?.options) ? raw.options.map((o: any) => String(o).trim()) : [];
  const candidate = {
    id: `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    vignette: typeof raw?.vignette === 'string' && raw.vignette.trim() ? raw.vignette.trim() : undefined,
    question: String(raw?.question ?? '').trim(),
    options: options_arr,
    correctIndex: Number(raw?.correctIndex),
    explanation: String(raw?.explanation ?? '').trim(),
    specialty: options.specialty as any,
    examCategory: options.examCategory as any,
    difficulty: options.difficulty,
    reference: `Tài liệu: ${raw?.sourceName || sourceNames[0] || 'không rõ'}`,
    questionType: (raw?.questionType as QuestionType) || fallbackType,
    sourceName: raw?.sourceName || sourceNames[0],
  };

  if (!isValidQuestion(candidate)) return null;
  return candidate as MedicalQuestion;
}

export interface GenerateResult {
  questions: MedicalQuestion[];
  rejected: number;
  note?: string;
}

/**
 * Sinh câu hỏi từ danh sách tài liệu, có kiểm chứng chống bịa.
 */
export async function generateQuestions(options: GenerateOptions): Promise<GenerateResult> {
  if (!options.documents.length) {
    throw new Error('Chưa có tài liệu nào. Hãy tải tài liệu lên trước.');
  }

  const docNames = options.documents.map((doc) => doc.name);
  let combined = options.documents
    .map((doc) => `--- TÀI LIỆU: ${doc.name} ---\n${doc.extractedText}`)
    .join('\n\n');

  let truncated = false;
  if (combined.length > MAX_DOC_CHARS_PER_REQUEST) {
    combined = combined.slice(0, MAX_DOC_CHARS_PER_REQUEST);
    truncated = true;
  }

  const total = Math.min(options.questionCount, MAX_QUESTIONS_PER_REQUEST);
  if (total < options.questionCount) {
    options.onProgress?.(
      `Tài liệu dài — chỉ sinh ${total}/${options.questionCount} câu mỗi lượt. Có thể bấm tạo thêm cho phần còn lại.`
    );
  }

  options.onProgress?.('AI đang đọc tài liệu và soạn câu hỏi...');

  const prompt = buildGenerationPrompt({ ...options, questionCount: total }, combined, docNames);
  const raw = await streamCompletion(prompt, options);

  options.onProgress?.('Đang kiểm chứng câu hỏi với tài liệu gốc...');

  let parsed: any[];
  try {
    parsed = extractJsonArray(raw);
  } catch (err: any) {
    throw new Error(`Không đọc được câu hỏi AI trả về: ${err.message}`);
  }

  // Ngân hàng tài liệu để đối chiếu trích dẫn (dùng toàn văn, không cắt).
  const fullText = options.documents.map((doc) => doc.extractedText).join('\n');

  const questions: MedicalQuestion[] = [];
  let rejected = 0;

  parsed.forEach((item, idx) => {
    const fallbackType = options.questionTypes[idx % options.questionTypes.length] || 'best_answer';
    const normalized = normalizeQuestion(item, options, fallbackType, docNames);
    if (!normalized) {
      rejected++;
      return;
    }

    // Chốt chặn: trích dẫn phải khớp tài liệu, nếu không thì loại câu hỏi.
    if (!verifySourceQuote(item?.sourceQuote, fullText)) {
      rejected++;
      return;
    }

    questions.push(normalized);
  });

  const notes: string[] = [];
  if (rejected > 0) {
    notes.push(`${rejected} câu bị loại vì trích dẫn không khớp tài liệu hoặc sai cấu trúc.`);
  }
  if (truncated) {
    notes.push('Tài liệu được rút gọn để vừa giới hạn xử lý.');
  }
  if (typeof parsed[0]?.note === 'string') {
    notes.push(parsed[0].note);
  }

  if (!questions.length) {
    throw new Error(
      'Không có câu hỏi nào vượt qua bước kiểm chứng. Tài liệu có thể quá ngắn hoặc không có nội dung học thuật. Hãy thử tài liệu khác.'
    );
  }

  return { questions, rejected, note: notes.join(' ') || undefined };
}
