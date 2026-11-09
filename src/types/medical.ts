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
