export type MedicalSpecialty =
  | 'internal'       // Nội khoa (Tim mạch, Hô hấp, Tiêu hóa, Thận, Nội tiết, Thần kinh)
  | 'surgery'        // Ngoại khoa (Tiêu hóa, Chấn thương, Tiết niệu, Lồng ngực)
  | 'pediatrics'     // Nhi khoa
  | 'obgyn'          // Sản - Phụ khoa
  | 'emergency'      // Hồi sức - Cấp cứu (ICU/Emergency)
  | 'pharmacology'   // Dược lý học
  | 'physiology'     // Sinh lý học & Sinh lý bệnh
  | 'anatomy'        // Giải phẫu học
  | 'pathology';     // Giải phẫu bệnh & Miễn dịch học

export type ExamCategory =
  | 'semester'       // Thi học kỳ
  | 'final'          // Thi cuối kỳ / Tốt nghiệp
  | 'competency';    // Thi Đánh giá Năng lực hành nghề Y khoa (National Licensing Exam)

export interface MedicalQuestion {
  id: string;
  vignette?: string; // Tình huống / Ca bệnh lâm sàng dẫn đề
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string; // Giải thích chi tiết cơ chế bệnh sinh, chẩn đoán, dược lý
  specialty: MedicalSpecialty;
  examCategory: ExamCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  reference: string; // Y văn tham chiếu (Harrison, BYT, Nelson, Sabiston, Katzung...)
  /** Kiểu câu hỏi (chỉ dùng cho câu sinh từ tài liệu). */
  questionType?: QuestionType;
  /** Tài liệu nguồn đã dùng để sinh câu hỏi. */
  sourceName?: string;
}

/**
 * Các kiểu câu hỏi trắc nghiệm AI có thể sinh ra.
 * Mỗi kiểu quy định "câu trả lời đúng" được hỏi theo cách nào.
 */
export type QuestionType =
  | 'best_answer'      // Chọn câu đúng nhất
  | 'which_is_false'   // Chọn câu SAI
  | 'which_is_true'    // Chọn câu ĐÚNG
  | 'not_correct'      // Khái niệm nào sau đây KHÔNG đúng
  | 'except_one'       // TẤT CẢ đúng TRỪ một
  | 'first_line'       // Lựa chọn ưu tiên/hàng đầu
  | 'most_likely'      // Chẩn đoán/tác nhân khả năng nhất
  | 'mechanism'        // Cơ chế bệnh sinh
  | 'contraindication' // Chống chỉ định
  | 'next_step';       // Bước xử trí tiếp theo

export interface QuestionTypeInfo {
  id: QuestionType;
  label: string;
  description: string;
  /** Tiền tố hướng dẫn AI diễn đạt đề bài. */
  instruction: string;
}

/** Tài liệu người dùng tải lên để sinh câu hỏi. */
export interface StudyDocument {
  id: string;
  name: string;
  size: number;
  extractedText: string;
  chars: number;
  addedAt: string;
}

/** Bộ câu hỏi trong Thư viện, lưu vĩnh viễn trên máy người dùng. */
export interface QuestionLibraryItem {
  id: string;
  /** Tên bộ đề do người dùng đặt. */
  title: string;
  subject: string;          // Môn học
  specialty: MedicalSpecialty;
  examCategory: ExamCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Tài liệu nguồn đã sinh ra bộ đề này. */
  sourceNames: string[];
  questionTypes: QuestionType[];
  questions: MedicalQuestion[];
  createdAt: string;
  updatedAt: string;
  /** Số lần đã làm bài. */
  attemptCount: number;
  bestScore?: number;
}

/** Cấu hình một lượt làm bài. */
export interface ExamRunConfig {
  questionCount: number;
  durationSeconds: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  mode: 'study' | 'timed';
}

/** Kết quả một lượt làm bài, dùng để thống kê và xem lại. */
export interface ExamAttemptResult {
  id: string;
  libraryItemId: string;
  questionCount: number;
  correctCount: number;
  durationSeconds: number;
  timeSpentSeconds: number;
  answers: Record<string, number>; // questionId -> optionIndex đã chọn
  completedAt: string;
  timedOut: boolean;
}

export interface MedicalExamSession {
  id: string;
  title: string;
  specialty?: MedicalSpecialty | 'all';
  examCategory: ExamCategory | 'all';
  questions: MedicalQuestion[];
  userAnswers: Record<number, number>; // questionIndex -> selectedOptionIndex
  isSubmitted: boolean;
  score: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export interface ClinicalCase {
  id: string;
  title: string;
  specialty: MedicalSpecialty;
  difficulty: 'Cơ bản' | 'Trung bình' | 'Nâng cao';
  age: number;
  gender: 'Nam' | 'Nữ';
  chiefComplaint: string; // Lý do vào viện
  historyOfPresentIllness: string; // Bệnh sử
  pastMedicalHistory: string; // Tiền sử
  vitalSigns: {
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    temperature: number;
    spo2: number;
  };
  physicalExamFindings: string[]; // Triệu chứng thực thể
  paraclinicalResults: {
    name: string;
    result: string;
    normalRange?: string;
    interpretation: string;
  }[];
  differentialDiagnoses: string[]; // Chẩn đoán phân biệt
  definitiveDiagnosis: string;     // Chẩn đoán xác định
  treatmentProtocol: string[];     // Phác đồ xử trí
  clinicalPearls: string;          // Điểm cốt lõi lâm sàng
}

export interface MedicalFlashcard {
  id: string;
  subject: string;
  front: string; // Thuật ngữ, câu hỏi, triệu chứng
  back: string;  // Giải thích, cơ chế, chỉ định, liều lượng
  hint?: string;
  tag: MedicalSpecialty | 'pharmacology' | 'signs';
}

export interface CalculatorScoreResult {
  score: number;
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao' | 'Rất cao' | 'Bình thường';
  interpretation: string;
  recommendation: string;
}
