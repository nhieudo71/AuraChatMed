import { QuestionType, QuestionTypeInfo } from '../types/medical';

/**
 * Danh mục các kiểu câu hỏi trắc nghiệm.
 * `instruction` được nhúng vào prompt gửi AI để đề bài diễn đạt đúng kiểu.
 */
export const QUESTION_TYPES: QuestionTypeInfo[] = [
  {
    id: 'best_answer',
    label: 'Chọn câu đúng nhất',
    description: 'Nhiều phương án đều có vẻ hợp lý, chỉ một phương án đúng nhất.',
    instruction:
      'Hỏi theo dạng "Phương án nào sau đây là đúng nhất?". Các phương án nhiễu phải gần đúng nhưng chưa đầy đủ hoặc kém chính xác hơn phương án đúng.',
  },
  {
    id: 'which_is_false',
    label: 'Chọn câu SAI',
    description: 'Ba phương án đúng, một phương án sai cần nhận diện.',
    instruction:
      'Hỏi theo dạng "Phát biểu nào sau đây là SAI?". Ba phương án đúng theo tài liệu, một phương án sai. Đáp án đúng của câu hỏi là phương án SAI.',
  },
  {
    id: 'which_is_true',
    label: 'Chọn câu ĐÚNG',
    description: 'Ba phương án sai, một phương án đúng duy nhất.',
    instruction:
      'Hỏi theo dạng "Phát biểu nào sau đây là ĐÚNG?". Ba phương án sai, một phương án đúng duy nhất theo tài liệu.',
  },
  {
    id: 'not_correct',
    label: 'Khái niệm nào KHÔNG đúng',
    description: 'Tập trung vào khái niệm/định nghĩa bị hiểu sai.',
    instruction:
      'Hỏi theo dạng "Khái niệm nào sau đây KHÔNG đúng?". Tập trung vào định nghĩa, phân loại, đặc điểm khái niệm trong tài liệu.',
  },
  {
    id: 'except_one',
    label: 'TẤT CẢ đúng TRỪ một',
    description: 'Liệt kê đặc điểm, tìm ngoại lệ không thuộc nhóm.',
    instruction:
      'Hỏi theo dạng "TẤT CẢ các đặc điểm sau đều đúng NGOẠI TRỪ:". Ba phương án thuộc nhóm, một phương án không thuộc.',
  },
  {
    id: 'first_line',
    label: 'Lựa chọn ưu tiên hàng đầu',
    description: 'Bước xử trí/chẩn đoán đầu tay theo phác đồ.',
    instruction:
      'Hỏi theo dạng "Lựa chọn ưu tiên hàng đầu là gì?" hoặc "Chỉ định đầu tay nào phù hợp nhất?". Chỉ dùng khi tài liệu có nội dung phác đồ/điều trị.',
  },
  {
    id: 'most_likely',
    label: 'Khả năng nhất / Chẩn đoán',
    description: 'Tình huống lâm sàng, chọn chẩn đoán hoặc tác nhân khả năng nhất.',
    instruction:
      'Hỏi theo dạng "Chẩn đoán nào khả năng nhất?" hoặc "Tác nhân nào là khả năng nhất?". Nếu tài liệu có mô tả lâm sàng, hãy viết một vignette ngắn dựa đúng trên dữ kiện đó.',
  },
  {
    id: 'mechanism',
    label: 'Cơ chế bệnh sinh',
    description: 'Giải thích cơ chế, sinh lý bệnh, dược lý.',
    instruction:
      'Hỏi theo dạng "Cơ chế nào giải thích đúng nhất?". Chỉ dùng khi tài liệu mô tả cơ chế.',
  },
  {
    id: 'contraindication',
    label: 'Chống chỉ định',
    description: 'Nhận diện chống chỉ định, cảnh báo an toàn.',
    instruction:
      'Hỏi theo dạng "Đâu là chống chỉ định?". Chỉ dùng khi tài liệu nêu rõ chống chỉ định hoặc cảnh báo.',
  },
  {
    id: 'next_step',
    label: 'Bước xử trí tiếp theo',
    description: 'Sau chẩn đoán, làm gì tiếp theo.',
    instruction:
      'Hỏi theo dạng "Bước xử trí tiếp theo phù hợp nhất là gì?". Chỉ dùng khi tài liệu mô tả quy trình xử trí nhiều bước.',
  },
];

export const QUESTION_TYPE_MAP: Record<QuestionType, QuestionTypeInfo> = QUESTION_TYPES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<QuestionType, QuestionTypeInfo>
);

export function getQuestionTypeLabel(type?: QuestionType): string {
  return type ? QUESTION_TYPE_MAP[type]?.label ?? 'Trắc nghiệm' : 'Trắc nghiệm';
}

/** Các mốc thời gian làm bài gợi ý sẵn. */
export const EXAM_TIME_PRESETS: { questionCount: number; minutes: number; label: string }[] = [
  { questionCount: 10, minutes: 5, label: '10 câu — 5 phút' },
  { questionCount: 15, minutes: 10, label: '15 câu — 10 phút' },
  { questionCount: 20, minutes: 15, label: '20 câu — 15 phút' },
  { questionCount: 30, minutes: 20, label: '30 câu — 20 phút' },
  { questionCount: 60, minutes: 30, label: '60 câu — 30 phút' },
];

/** Mặc định: 1 câu / 30 giây. */
export const SECONDS_PER_QUESTION = 30;

export function suggestedMinutes(questionCount: number): number {
  return Math.max(1, Math.round((questionCount * SECONDS_PER_QUESTION) / 60));
}

export const SPECIALTY_LABELS: Record<string, string> = {
  internal: 'Nội khoa',
  surgery: 'Ngoại khoa',
  pediatrics: 'Nhi khoa',
  obgyn: 'Sản - Phụ khoa',
  emergency: 'Cấp cứu - Hồi sức',
  pharmacology: 'Dược lý học',
  physiology: 'Sinh lý học',
  anatomy: 'Giải phẫu học',
  pathology: 'Giải phẫu bệnh & Miễn dịch',
};

export const EXAM_CATEGORY_LABELS: Record<string, string> = {
  semester: 'Thi học kỳ',
  final: 'Thi cuối kỳ / Tốt nghiệp',
  competency: 'Đánh giá năng lực hành nghề',
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
};
