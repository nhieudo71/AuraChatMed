import React, { useState, useEffect } from 'react';
import {
  X,
  Stethoscope,
  BookOpen,
  FileText,
  Activity,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Timer,
  Award,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  AlertTriangle,
  Heart,
  Share2,
  Check,
  Brain,
  MessageSquare,
} from 'lucide-react';
import {
  MedicalSpecialty,
  ExamCategory,
  MedicalQuestion,
  ClinicalCase,
  MedicalFlashcard,
} from '../../types/medical';
import { MEDICAL_QUESTIONS } from '../../data/medicalQuestionBank';
import { CLINICAL_CASES } from '../../data/clinicalCasesData';
import { MEDICAL_FLASHCARDS } from '../../data/medicalFlashcardsData';
import {
  calculateGCS,
  calculateCURB65,
  calculateAlvarado,
  calculateCHA2DS2VASc,
  calculateQSOFA,
} from '../../utils/medicalCalculators';
import { MEDICAL_STUDENT_MASTER_PROMPT } from '../SystemPromptModal';

interface MedicalExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMedicalChat: (systemPrompt: string, starterMessage?: string) => void;
}

export const MedicalExamModal: React.FC<MedicalExamModalProps> = ({
  isOpen,
  onClose,
  onStartMedicalChat,
}) => {
  const [activeTab, setActiveTab] = useState<'mcq' | 'cases' | 'calculators' | 'flashcards' | 'ai_assistant'>('mcq');

  // MCQ State
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedExamCategory, setSelectedExamCategory] = useState<string>('all');
  const [examMode, setExamMode] = useState<'study' | 'timed'>('study');
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isExamSubmitted, setIsExamSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState<Record<number, boolean>>({});
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Filtered Questions
  const filteredQuestions = MEDICAL_QUESTIONS.filter((q) => {
    const matchSpecialty = selectedSpecialty === 'all' || q.specialty === selectedSpecialty;
    const matchCategory = selectedExamCategory === 'all' || q.examCategory === selectedExamCategory;
    return matchSpecialty && matchCategory;
  });

  const activeQuestions = filteredQuestions.length > 0 ? filteredQuestions : MEDICAL_QUESTIONS;

  // Timer effect for timed mode
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (examMode === 'timed' && isTimerRunning && !isExamSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [examMode, isTimerRunning, isExamSubmitted]);

  // Clinical Cases State
  const [activeCaseIndex, setActiveCaseIndex] = useState(0);
  const [revealedCaseSteps, setRevealedCaseSteps] = useState<Record<string, boolean>>({
    history: true,
    vitals: true,
    exam: false,
    paraclinical: false,
    differential: false,
    diagnosis: false,
    treatment: false,
  });

  // Flashcards State
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Calculators State
  const [activeCalc, setActiveCalc] = useState<'gcs' | 'curb65' | 'alvarado' | 'cha2ds2vasc' | 'qsofa'>('gcs');

  // GCS Inputs
  const [gcsEye, setGcsEye] = useState(4);
  const [gcsVerbal, setGcsVerbal] = useState(5);
  const [gcsMotor, setGcsMotor] = useState(6);

  // CURB-65 Inputs
  const [curbC, setCurbC] = useState(false);
  const [curbU, setCurbU] = useState(false);
  const [curbR, setCurbR] = useState(false);
  const [curbB, setCurbB] = useState(false);
  const [curb65, setCurb65] = useState(false);

  // Alvarado Inputs
  const [alvMigratory, setAlvMigratory] = useState(true);
  const [alvAnorexia, setAlvAnorexia] = useState(true);
  const [alvNausea, setAlvNausea] = useState(true);
  const [alvRLQTenderness, setAlvRLQTenderness] = useState(true);
  const [alvRebound, setAlvRebound] = useState(true);
  const [alvFever, setAlvFever] = useState(true);
  const [alvLeuko, setAlvLeuko] = useState(true);
  const [alvNeutro, setAlvNeutro] = useState(true);

  // CHA2DS2-VASc Inputs
  const [chaAge, setChaAge] = useState(70);
  const [chaGender, setChaGender] = useState<'male' | 'female'>('male');
  const [chaHeartFailure, setChaHeartFailure] = useState(false);
  const [chaHTN, setChaHTN] = useState(true);
  const [chaStroke, setChaStroke] = useState(false);
  const [chaVascular, setChaVascular] = useState(false);
  const [chaDiabetes, setChaDiabetes] = useState(false);

  // qSOFA Inputs
  const [qsofaRR, setQsofaRR] = useState(false);
  const [qsofaMental, setQsofaMental] = useState(false);
  const [qsofaSBP, setQsofaSBP] = useState(false);

  if (!isOpen) return null;

  // Handlers for MCQ
  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (isExamSubmitted && examMode === 'timed') return;
    setUserAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
    if (examMode === 'study') {
      setShowExplanation((prev) => ({ ...prev, [qIndex]: true }));
    }
  };

  const handleSubmitExam = () => {
    setIsExamSubmitted(true);
    setIsTimerRunning(false);
  };

  const handleResetExam = () => {
    setUserAnswers({});
    setIsExamSubmitted(false);
    setCurrentQuestionIndex(0);
    setShowExplanation({});
    setTimerSeconds(0);
    setIsTimerRunning(examMode === 'timed');
  };

  const calculateScore = () => {
    let correctCount = 0;
    activeQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) {
        correctCount += 1;
      }
    });
    return {
      score: correctCount,
      total: activeQuestions.length,
      percentage: Math.round((correctCount / activeQuestions.length) * 100),
    };
  };

  const scoreResult = calculateScore();

  // Format time
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Launch Medical AI Session
  const handleLaunchMedicalChat = (mode: 'consultant' | 'case' | 'custom', customText?: string) => {
    const medicalSystemPrompt = MEDICAL_STUDENT_MASTER_PROMPT;

    let initialPrompt = 'Chào Giáo sư! Em là sinh viên y khoa đang ôn tập lâm sàng. Xin Thầy/Cô hỗ trợ em biện luận ca bệnh và giải thích cơ chế bệnh sinh.';
    if (mode === 'case' && CLINICAL_CASES[activeCaseIndex]) {
      const c = CLINICAL_CASES[activeCaseIndex];
      initialPrompt = `Chào Giáo sư, em muốn thảo luận ca lâm sàng sau:
Bệnh nhân: ${c.title} (${c.gender}, ${c.age} tuổi)
Lý do vào viện: ${c.chiefComplaint}
Bệnh sử: ${c.historyOfPresentIllness}
Dấu hiệu sinh tồn: HA ${c.vitalSigns.bloodPressure}, Mạch ${c.vitalSigns.heartRate} ck/p, Nhịp thở ${c.vitalSigns.respiratoryRate} l/p, SpO2 ${c.vitalSigns.spo2}%.
Em xin Thầy/Cô đặt câu hỏi phản biện từng bước để em tập biện luận chẩn đoán và lập kế hoạch điều trị cho ca này!`;
    } else if (customText) {
      initialPrompt = customText;
    }

    onStartMedicalChat(medicalSystemPrompt, initialPrompt);
    onClose();
  };

  const currentQ = activeQuestions[currentQuestionIndex] || activeQuestions[0];
  const activeCase = CLINICAL_CASES[activeCaseIndex] || CLINICAL_CASES[0];
  const activeCard = MEDICAL_FLASHCARDS[flashcardIndex] || MEDICAL_FLASHCARDS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between bg-emerald-500/5 dark:bg-emerald-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
                  AuraMed - Không Gian Y Khoa Chuyên Sâu
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Dành cho Sinh Viên Y Dược
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Luyện thi Học kỳ, Cuối kỳ, Đánh giá Năng lực hành nghề & Bệnh án ảo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            title="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-stone-100/70 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('mcq')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'mcq'
                ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <BookOpen size={15} />
            <span>Luyện Thi Trắc Nghiệm ({MEDICAL_QUESTIONS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'cases'
                ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <FileText size={15} />
            <span>Bệnh Án Lâm Sàng Ảo</span>
          </button>

          <button
            onClick={() => setActiveTab('calculators')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'calculators'
                ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Activity size={15} />
            <span>Thang Điểm Y Khoa</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'flashcards'
                ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Layers size={15} />
            <span>Flashcards Ôn Nhanh</span>
          </button>

          <button
            onClick={() => setActiveTab('ai_assistant')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all shrink-0 ${
              activeTab === 'ai_assistant'
                ? 'bg-white dark:bg-stone-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <Sparkles size={15} />
            <span>Cố Vấn AI Y Khoa</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: MCQ EXAMS */}
          {activeTab === 'mcq' && (
            <div className="space-y-4">
              {/* Filter & Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-500">Chuyên khoa:</span>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => {
                      setSelectedSpecialty(e.target.value);
                      handleResetExam();
                    }}
                    className="bg-white dark:bg-stone-800 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    <option value="all">Tất cả chuyên khoa</option>
                    <option value="internal">Nội khoa (Tim mạch, Hô hấp, Tiêu hóa)</option>
                    <option value="surgery">Ngoại khoa</option>
                    <option value="pediatrics">Nhi khoa</option>
                    <option value="obgyn">Sản - Phụ khoa</option>
                    <option value="emergency">Cấp cứu - Hồi sức tích cực</option>
                    <option value="pharmacology">Dược lý học</option>
                    <option value="physiology">Sinh lý học & Thăng bằng toan kiềm</option>
                    <option value="anatomy">Giải phẫu học</option>
                    <option value="pathology">Giải phẫu bệnh & Miễn dịch</option>
                  </select>

                  <span className="font-semibold text-stone-500 ml-2">Mục tiêu:</span>
                  <select
                    value={selectedExamCategory}
                    onChange={(e) => {
                      setSelectedExamCategory(e.target.value);
                      handleResetExam();
                    }}
                    className="bg-white dark:bg-stone-800 px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-800 dark:text-stone-200 focus:outline-none"
                  >
                    <option value="all">Tất cả kỳ thi</option>
                    <option value="semester">Thi Học Kỳ</option>
                    <option value="final">Thi Cuối Kỳ / Tốt Nghiệp</option>
                    <option value="competency">Đánh Giá Năng Lực (Licensing)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-xl bg-stone-200 dark:bg-stone-700 p-0.5">
                    <button
                      onClick={() => {
                        setExamMode('study');
                        setIsTimerRunning(false);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        examMode === 'study' ? 'bg-white dark:bg-stone-800 text-emerald-600 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      Học tập (Biện luận)
                    </button>
                    <button
                      onClick={() => {
                        setExamMode('timed');
                        setIsTimerRunning(true);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        examMode === 'timed' ? 'bg-white dark:bg-stone-800 text-emerald-600 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      Thi thử bấm giờ
                    </button>
                  </div>

                  {examMode === 'timed' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono text-xs font-bold border border-amber-500/20">
                      <Timer size={13} />
                      <span>{formatTimer(timerSeconds)}</span>
                    </div>
                  )}

                  <button
                    onClick={handleResetExam}
                    className="p-1.5 rounded-xl text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-750 transition-colors"
                    title="Làm lại đề thi"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>

              {/* Progress and Question Counter */}
              <div className="flex items-center justify-between text-xs text-stone-500">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    Câu {currentQuestionIndex + 1} / {activeQuestions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 capitalize text-[11px]">
                    {currentQ.specialty}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    {currentQ.examCategory === 'competency' ? 'Đánh Giá Năng Lực' : currentQ.examCategory === 'final' ? 'Thi Cuối Kỳ' : 'Thi Học Kỳ'}
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto max-w-[50%]">
                  {activeQuestions.map((_, idx) => {
                    const answered = userAnswers[idx] !== undefined;
                    const isCurrent = idx === currentQuestionIndex;
                    const isCorrect = isExamSubmitted && userAnswers[idx] === activeQuestions[idx].correctIndex;
                    const isWrong = isExamSubmitted && answered && !isCorrect;

                    let bg = 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400';
                    if (isExamSubmitted) {
                      bg = isCorrect
                        ? 'bg-emerald-500 text-white'
                        : isWrong
                        ? 'bg-rose-500 text-white'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-400';
                    } else if (answered) {
                      bg = 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold';
                    }
                    if (isCurrent) {
                      bg += ' ring-2 ring-emerald-500';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 transition-all ${bg}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
                {/* Clinical Vignette if present */}
                {currentQ.vignette && (
                  <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 mb-1">
                      <FileText size={14} />
                      <span>Tình huống ca bệnh lâm sàng:</span>
                    </div>
                    <p>{currentQ.vignette}</p>
                  </div>
                )}

                {/* Question Prompt */}
                <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
                  {currentQ.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2">
                  {currentQ.options.map((option, optIdx) => {
                    const isSelected = userAnswers[currentQuestionIndex] === optIdx;
                    const isCorrect = optIdx === currentQ.correctIndex;
                    const showResult = (examMode === 'study' && userAnswers[currentQuestionIndex] !== undefined) || isExamSubmitted;

                    let btnClass = 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200';
                    if (isSelected && !showResult) {
                      btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (showResult) {
                      if (isCorrect) {
                        btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                      } else if (isSelected && !isCorrect) {
                        btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-medium';
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(currentQuestionIndex, optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${btnClass}`}
                      >
                        <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span className="flex-1 leading-relaxed">{option}</span>
                        {showResult && isCorrect && <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />}
                        {showResult && isSelected && !isCorrect && <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Explanation / Reasoning */}
                {((examMode === 'study' && userAnswers[currentQuestionIndex] !== undefined) || isExamSubmitted) && (
                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 text-xs space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                      <Brain size={15} />
                      <span>Biện luận lâm sàng & Cơ chế bệnh sinh:</span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                      {currentQ.explanation}
                    </p>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60">
                      <strong>Tài liệu Y văn tham chiếu:</strong> {currentQ.reference}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Nav Buttons for Questions */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={16} />
                  <span>Câu trước</span>
                </button>

                <div className="flex items-center gap-2">
                  {examMode === 'timed' && !isExamSubmitted && (
                    <button
                      onClick={handleSubmitExam}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      Nộp bài thi ({Object.keys(userAnswers).length}/{activeQuestions.length})
                    </button>
                  )}

                  {isExamSubmitted && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-xs">
                      <Award size={16} className="text-amber-500" />
                      <span>
                        Điểm số: <strong>{scoreResult.score}/{scoreResult.total}</strong> ({scoreResult.percentage}%)
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => Math.min(prev + 1, activeQuestions.length - 1))}
                    disabled={currentQuestionIndex === activeQuestions.length - 1}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    <span>Câu tiếp theo</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIRTUAL CLINICAL CASES */}
          {activeTab === 'cases' && (
            <div className="space-y-4">
              {/* Case selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {CLINICAL_CASES.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveCaseIndex(idx);
                      setRevealedCaseSteps({
                        history: true,
                        vitals: true,
                        exam: false,
                        paraclinical: false,
                        differential: false,
                        diagnosis: false,
                        treatment: false,
                      });
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                      activeCaseIndex === idx
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
                    }`}
                  >
                    Ca {idx + 1}: {c.title.slice(0, 32)}...
                  </button>
                ))}
              </div>

              {/* Case details header */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white font-bold text-[10px]">
                      {activeCase.difficulty}
                    </span>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      {activeCase.title}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
                    Bệnh nhân: {activeCase.gender}, {activeCase.age} tuổi | Chuyên khoa: {activeCase.specialty}
                  </p>
                </div>

                <button
                  onClick={() => handleLaunchMedicalChat('case')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
                  title="Mở phòng hội chẩn trực tiếp với AI về ca bệnh này"
                >
                  <MessageSquare size={14} />
                  <span>Hội chẩn cùng AI</span>
                </button>
              </div>

              {/* Interactive Socratic Flow */}
              <div className="space-y-3 text-xs">
                {/* 1. Lý do vào viện & Bệnh sử */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <FileText size={15} />
                      <span>1. Lý do vào viện & Bệnh sử</span>
                    </span>
                  </div>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    <strong>Lý do vào viện:</strong> {activeCase.chiefComplaint}
                  </p>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    <strong>Bệnh sử:</strong> {activeCase.historyOfPresentIllness}
                  </p>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    <strong>Tiền sử:</strong> {activeCase.pastMedicalHistory}
                  </p>
                </div>

                {/* 2. Dấu hiệu sinh tồn */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                    <Heart size={15} />
                    <span>2. Dấu hiệu sinh tồn lúc vào viện</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <div className="text-stone-400 text-[10px]">Huyết áp</div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">{activeCase.vitalSigns.bloodPressure}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <div className="text-stone-400 text-[10px]">Mạch</div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">{activeCase.vitalSigns.heartRate} ck/p</div>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <div className="text-stone-400 text-[10px]">Nhịp thở</div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">{activeCase.vitalSigns.respiratoryRate} l/p</div>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <div className="text-stone-400 text-[10px]">Nhiệt độ</div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">{activeCase.vitalSigns.temperature}°C</div>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800">
                      <div className="text-stone-400 text-[10px]">SpO2</div>
                      <div className="font-bold text-stone-800 dark:text-stone-200">{activeCase.vitalSigns.spo2}%</div>
                    </div>
                  </div>
                </div>

                {/* 3. Khám thực thể (Interactive Reveal) */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Stethoscope size={15} />
                      <span>3. Khám thực thể</span>
                    </span>
                    {!revealedCaseSteps.exam && (
                      <button
                        onClick={() => setRevealedCaseSteps((prev) => ({ ...prev, exam: true }))}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[11px] hover:bg-amber-500/20"
                      >
                        Mở kết quả khám
                      </button>
                    )}
                  </div>
                  {revealedCaseSteps.exam ? (
                    <ul className="list-disc list-inside space-y-1 text-stone-700 dark:text-stone-300 leading-relaxed pl-1">
                      {activeCase.physicalExamFindings.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-stone-400 italic text-[11px]">
                      Hãy suy nghĩ xem bạn cần khám những triệu chứng thực thể nào ở bệnh nhân này trước khi mở kết quả!
                    </div>
                  )}
                </div>

                {/* 4. Cận lâm sàng (Interactive Reveal) */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <Activity size={15} />
                      <span>4. Kết quả Cận lâm sàng</span>
                    </span>
                    {!revealedCaseSteps.paraclinical && (
                      <button
                        onClick={() => setRevealedCaseSteps((prev) => ({ ...prev, paraclinical: true }))}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[11px] hover:bg-purple-500/20"
                      >
                        Đọc kết quả CLS
                      </button>
                    )}
                  </div>
                  {revealedCaseSteps.paraclinical ? (
                    <div className="space-y-2 pt-1">
                      {activeCase.paraclinicalResults.map((para, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-850 border border-stone-200/60 dark:border-stone-700/60">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">{para.name}</div>
                          <div className="text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">{para.result}</div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 italic">{para.interpretation}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-stone-400 italic text-[11px]">
                      Bạn sẽ chỉ định các xét nghiệm và chẩn đoán hình ảnh gì cho ca bệnh này?
                    </div>
                  )}
                </div>

                {/* 5. Chẩn đoán xác định & Phác đồ điều trị */}
                <div className="p-4 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2">
                  <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Award size={15} />
                      <span>5. Chẩn đoán xác định & Phác đồ điều trị</span>
                    </span>
                    {!revealedCaseSteps.diagnosis && (
                      <button
                        onClick={() => setRevealedCaseSteps((prev) => ({ ...prev, diagnosis: true, treatment: true }))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-semibold text-[11px] hover:bg-emerald-600"
                      >
                        Xem chẩn đoán & phác đồ
                      </button>
                    )}
                  </div>
                  {revealedCaseSteps.diagnosis && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="font-semibold text-emerald-800 dark:text-emerald-300">Chẩn đoán xác định:</div>
                        <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-medium mt-1">
                          {activeCase.definitiveDiagnosis}
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold text-stone-900 dark:text-stone-100">Phác đồ xử trí khuyến cáo:</div>
                        <ul className="list-disc list-inside space-y-1 text-stone-700 dark:text-stone-300 leading-relaxed mt-1 pl-1">
                          {activeCase.treatmentProtocol.map((treat, idx) => (
                            <li key={idx}>{treat}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 text-stone-800 dark:text-stone-200">
                        <strong>Điểm cốt lõi lâm sàng (Clinical Pearl):</strong> {activeCase.clinicalPearls}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CALCULATORS */}
          {activeTab === 'calculators' && (
            <div className="space-y-4">
              {/* Calculator selector pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
                <button
                  onClick={() => setActiveCalc('gcs')}
                  className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
                    activeCalc === 'gcs' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                  }`}
                >
                  Glasgow (GCS - Tri giác)
                </button>
                <button
                  onClick={() => setActiveCalc('curb65')}
                  className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
                    activeCalc === 'curb65' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                  }`}
                >
                  CURB-65 (Viêm phổi)
                </button>
                <button
                  onClick={() => setActiveCalc('alvarado')}
                  className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
                    activeCalc === 'alvarado' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                  }`}
                >
                  Alvarado (Ruột thừa)
                </button>
                <button
                  onClick={() => setActiveCalc('cha2ds2vasc')}
                  className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
                    activeCalc === 'cha2ds2vasc' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                  }`}
                >
                  CHA2DS2-VASc (Đột quỵ Rung nhĩ)
                </button>
                <button
                  onClick={() => setActiveCalc('qsofa')}
                  className={`px-3 py-2 rounded-xl shrink-0 transition-all ${
                    activeCalc === 'qsofa' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-stone-100 dark:bg-stone-800 text-stone-600'
                  }`}
                >
                  qSOFA (Sepsis)
                </button>
              </div>

              {/* Calculator Dynamic Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-4">
                {/* 1. GCS */}
                {activeCalc === 'gcs' && (() => {
                  const res = calculateGCS(gcsEye, gcsVerbal, gcsMotor);
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          Thang điểm hôn mê Glasgow (GCS - Glasgow Coma Scale)
                        </h4>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                          Đánh giá mức độ rối loạn ý thức và chấn thương sọ não (Tổng điểm 3 - 15)
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="font-semibold block mb-1">Mắt (Eye Response - E: 1 - 4 điểm):</label>
                          <select
                            value={gcsEye}
                            onChange={(e) => setGcsEye(Number(e.target.value))}
                            className="w-full bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700"
                          >
                            <option value={4}>4 điểm: Mở mắt tự nhiên</option>
                            <option value={3}>3 điểm: Mở mắt khi gọi / nghe tiếng động</option>
                            <option value={2}>2 điểm: Mở mắt khi kích thích đau</option>
                            <option value={1}>1 điểm: Không mở mắt dù kích thích đau</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold block mb-1">Lời nói (Verbal Response - V: 1 - 5 điểm):</label>
                          <select
                            value={gcsVerbal}
                            onChange={(e) => setGcsVerbal(Number(e.target.value))}
                            className="w-full bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700"
                          >
                            <option value={5}>5 điểm: Trả lời nhanh, đúng, định hướng tốt</option>
                            <option value={4}>4 điểm: Trả lời lú lẫn, nhầm lẫn thời gian/không gian</option>
                            <option value={3}>3 điểm: Nói từ ngữ rời rạc, không thích hợp</option>
                            <option value={2}>2 điểm: Kêu rên, phát âm ú ớ không thành từ</option>
                            <option value={1}>1 điểm: Hoàn toàn không phát âm</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-semibold block mb-1">Vận động (Motor Response - M: 1 - 6 điểm):</label>
                          <select
                            value={gcsMotor}
                            onChange={(e) => setGcsMotor(Number(e.target.value))}
                            className="w-full bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700"
                          >
                            <option value={6}>6 điểm: Làm theo đúng y lệnh</option>
                            <option value={5}>5 điểm: Gạt đúng chỗ khi kích thích đau</option>
                            <option value={4}>4 điểm: Rụt tay/chân lại khi kích thích đau</option>
                            <option value={3}>3 điểm: Co cứng mất vỏ (Decorticate posturing)</option>
                            <option value={2}>2 điểm: Duỗi cứng mất não (Decerebrate posturing)</option>
                            <option value={1}>1 điểm: Không đáp ứng vận động</option>
                          </select>
                        </div>
                      </div>

                      {/* Result Box */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            Tổng điểm GCS: <span className="text-emerald-600 dark:text-emerald-400 text-base">{res.score}/15</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            res.score >= 13 ? 'bg-emerald-500 text-white' : res.score >= 9 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {res.riskLevel === 'Thấp' ? 'Nhẹ' : res.riskLevel === 'Trung bình' ? 'Vừa' : 'Nặng / Hôn mê'}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 font-medium">{res.interpretation}</p>
                        <p className="text-stone-600 dark:text-stone-400 italic">Khuyến cáo: {res.recommendation}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. CURB-65 */}
                {activeCalc === 'curb65' && (() => {
                  const res = calculateCURB65(curbC, curbU, curbR, curbB, curb65);
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          Thang điểm CURB-65 (Viêm phổi mắc phải cộng đồng)
                        </h4>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                          Đánh giá phân tầng mức độ nặng và chỉ định nơi điều trị (Ngoại trú, Nội trú, ICU)
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: 'c', label: 'C - Confusion: Lú lẫn, suy giảm nhận thức mới xuất hiện', val: curbC, set: setCurbC },
                          { id: 'u', label: 'U - Urea: Nồng độ Urea máu > 7 mmol/L (BUN > 19 mg/dL)', val: curbU, set: setCurbU },
                          { id: 'r', label: 'R - Respiratory rate: Nhịp thở >= 30 lần/phút', val: curbR, set: setCurbR },
                          { id: 'b', label: 'B - Blood pressure: Huyết áp tâm thu < 90 hoặc tâm trương <= 60 mmHg', val: curbB, set: setCurbB },
                          { id: '65', label: '65 - Tuổi >= 65 tuổi', val: curb65, set: setCurb65 },
                        ].map((item) => (
                          <label key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-850 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={(e) => item.set(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-stone-800 dark:text-stone-200">{item.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Result Box */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            Điểm CURB-65: <span className="text-emerald-600 dark:text-emerald-400 text-base">{res.score}/5</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            res.score <= 1 ? 'bg-emerald-500 text-white' : res.score === 2 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {res.score <= 1 ? 'Ngoại trú' : res.score === 2 ? 'Nội trú khoa Hô hấp' : 'Cân nhắc ICU'}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 font-medium">{res.interpretation}</p>
                        <p className="text-stone-600 dark:text-stone-400 italic">{res.recommendation}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. ALVARADO */}
                {activeCalc === 'alvarado' && (() => {
                  const res = calculateAlvarado({
                    migratoryPain: alvMigratory,
                    anorexia: alvAnorexia,
                    nauseaVomiting: alvNausea,
                    rlqTenderness: alvRLQTenderness,
                    reboundTenderness: alvRebound,
                    fever: alvFever,
                    leukocytosis: alvLeuko,
                    neutrophilShift: alvNeutro,
                  });
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          Thang điểm Alvarado (Viêm ruột thừa cấp)
                        </h4>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                          Tiên lượng và hỗ trợ quyết định phẫu thuật bụng ngoại khoa (Tổng điểm 10)
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: '1', label: 'Đau di chuyển từ thượng vị/rốn xuống hố chậu phải (+1 điểm)', val: alvMigratory, set: setAlvMigratory },
                          { id: '2', label: 'Chán ăn (+1 điểm)', val: alvAnorexia, set: setAlvAnorexia },
                          { id: '3', label: 'Buồn nôn hoặc nôn (+1 điểm)', val: alvNausea, set: setAlvNausea },
                          { id: '4', label: 'Đau nhói vùng hố chậu phải (RLQ tenderness) (+2 điểm)', val: alvRLQTenderness, set: setAlvRLQTenderness },
                          { id: '5', label: 'Dấu hiệu phản ứng dội (Blumberg) (+) (+1 điểm)', val: alvRebound, set: setAlvRebound },
                          { id: '6', label: 'Sốt >= 37.3°C (+1 điểm)', val: alvFever, set: setAlvFever },
                          { id: '7', label: 'Bạch cầu tăng > 10.000/uL (+2 điểm)', val: alvLeuko, set: setAlvLeuko },
                          { id: '8', label: 'Bạch cầu đa nhân trung tính chuyển trái > 75% (+1 điểm)', val: alvNeutro, set: setAlvNeutro },
                        ].map((item) => (
                          <label key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-850 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={(e) => item.set(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-stone-800 dark:text-stone-200">{item.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Result Box */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            Điểm Alvarado: <span className="text-emerald-600 dark:text-emerald-400 text-base">{res.score}/10</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            res.score <= 4 ? 'bg-emerald-500 text-white' : res.score <= 6 ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {res.score <= 4 ? 'Ít nghĩ đến' : res.score <= 6 ? 'Theo dõi / CT' : 'Chỉ định mổ'}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 font-medium">{res.interpretation}</p>
                        <p className="text-stone-600 dark:text-stone-400 italic">{res.recommendation}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. CHA2DS2-VASc */}
                {activeCalc === 'cha2ds2vasc' && (() => {
                  const res = calculateCHA2DS2VASc({
                    age: chaAge,
                    gender: chaGender,
                    heartFailure: chaHeartFailure,
                    hypertension: chaHTN,
                    strokeTIAThrombo: chaStroke,
                    vascularDisease: chaVascular,
                    diabetes: chaDiabetes,
                  });
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          Thang điểm CHA2DS2-VASc (Đột quỵ trong Rung nhĩ)
                        </h4>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                          Khuyến cáo chỉ định thuốc chống đông máu đường uống (NOAC/DOAC/VKA)
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold block mb-1">Tuổi bệnh nhân:</label>
                          <input
                            type="number"
                            value={chaAge}
                            onChange={(e) => setChaAge(Number(e.target.value))}
                            className="w-full bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700"
                          />
                        </div>

                        <div>
                          <label className="font-semibold block mb-1">Giới tính:</label>
                          <select
                            value={chaGender}
                            onChange={(e) => setChaGender(e.target.value as 'male' | 'female')}
                            className="w-full bg-stone-50 dark:bg-stone-800 p-2 rounded-xl border border-stone-200 dark:border-stone-700"
                          >
                            <option value="male">Nam</option>
                            <option value="female">Nữ (+1 điểm)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: 'hf', label: 'C - Suy tim sung huyết / LVEF <= 40% (+1 điểm)', val: chaHeartFailure, set: setChaHeartFailure },
                          { id: 'htn', label: 'H - Tăng huyết áp (+1 điểm)', val: chaHTN, set: setChaHTN },
                          { id: 'dm', label: 'D - Đái tháo đường (+1 điểm)', val: chaDiabetes, set: setChaDiabetes },
                          { id: 'stroke', label: 'S2 - Tiền sử Đột quỵ / TIA / Thuyên tắc huyết khối (+2 điểm)', val: chaStroke, set: setChaStroke },
                          { id: 'vasc', label: 'V - Bệnh mạch máu (Tiền sử NMCT, bệnh ĐM ngoại biên) (+1 điểm)', val: chaVascular, set: setChaVascular },
                        ].map((item) => (
                          <label key={item.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-stone-850 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={(e) => item.set(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-stone-800 dark:text-stone-200">{item.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Result Box */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            Điểm CHA2DS2-VASc: <span className="text-emerald-600 dark:text-emerald-400 text-base">{res.score} điểm</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            res.riskLevel === 'Thấp' ? 'bg-emerald-500 text-white' : res.riskLevel === 'Trung bình' ? 'bg-amber-500 text-white' : 'bg-rose-500 text-white'
                          }`}>
                            {res.riskLevel === 'Thấp' ? 'Không cần kháng đông' : res.riskLevel === 'Trung bình' ? 'Cân nhắc kháng đông' : 'Chỉ định kháng đông bắt buộc'}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 font-medium">{res.interpretation}</p>
                        <p className="text-stone-600 dark:text-stone-400 italic">{res.recommendation}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. qSOFA */}
                {activeCalc === 'qsofa' && (() => {
                  const res = calculateQSOFA(qsofaRR, qsofaMental, qsofaSBP);
                  return (
                    <div className="space-y-4 text-xs">
                      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
                        <h4 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                          Thang điểm Quick SOFA (qSOFA - Sàng lọc Sepsis)
                        </h4>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">
                          Nhận diện nhanh bệnh nhân nghi ngờ nhiễm khuẩn huyết có nguy cơ tử vong cao tại khoa phòng thông thường
                        </p>
                      </div>

                      <div className="space-y-2">
                        {[
                          { id: 'rr', label: 'Nhịp thở >= 22 lần/phút (+1 điểm)', val: qsofaRR, set: setQsofaRR },
                          { id: 'mental', label: 'Rối loạn ý thức / thay đổi tri giác (GCS < 15) (+1 điểm)', val: qsofaMental, set: setQsofaMental },
                          { id: 'sbp', label: 'Huyết áp tâm thu <= 100 mmHg (+1 điểm)', val: qsofaSBP, set: setQsofaSBP },
                        ].map((item) => (
                          <label key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-850 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.val}
                              onChange={(e) => item.set(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-stone-800 dark:text-stone-200 font-medium">{item.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Result Box */}
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            Điểm qSOFA: <span className="text-emerald-600 dark:text-emerald-400 text-base">{res.score}/3</span>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            res.score >= 2 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                          }`}>
                            {res.score >= 2 ? 'Cảnh báo SEPSIS nguy kịch' : 'Nguy cơ thấp'}
                          </span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 font-medium">{res.interpretation}</p>
                        <p className="text-stone-600 dark:text-stone-400 italic">{res.recommendation}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  Thẻ {flashcardIndex + 1} / {MEDICAL_FLASHCARDS.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                  {activeCard.subject}
                </span>
              </div>

              {/* Flashcard container */}
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className="min-h-[220px] p-6 rounded-3xl bg-gradient-to-br from-white to-stone-50 dark:from-stone-900 dark:to-stone-850 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 cursor-pointer shadow-md flex flex-col justify-between transition-all select-none"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {isCardFlipped ? 'Đáp án & Cơ chế' : 'Câu hỏi / Triệu chứng'}
                  </span>
                  <span className="text-[10px] text-stone-400">Nhấn để lật thẻ</span>
                </div>

                <div className="my-auto py-4 text-center">
                  <p className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 leading-relaxed whitespace-pre-line">
                    {isCardFlipped ? activeCard.back : activeCard.front}
                  </p>
                </div>

                {activeCard.hint && !isCardFlipped && (
                  <div className="pt-2 text-center">
                    {showHint ? (
                      <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg">
                        Gợi ý: {activeCard.hint}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHint(true);
                        }}
                        className="text-xs text-stone-400 hover:text-amber-500 underline"
                      >
                        Xem gợi ý
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Card Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => {
                    setFlashcardIndex((prev) => Math.max(prev - 1, 0));
                    setIsCardFlipped(false);
                    setShowHint(false);
                  }}
                  disabled={flashcardIndex === 0}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  <span>Thẻ trước</span>
                </button>

                <button
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-xs"
                >
                  {isCardFlipped ? 'Xem lại mặt trước' : 'Lật xem đáp án'}
                </button>

                <button
                  onClick={() => {
                    setFlashcardIndex((prev) => Math.min(prev + 1, MEDICAL_FLASHCARDS.length - 1));
                    setIsCardFlipped(false);
                    setShowHint(false);
                  }}
                  disabled={flashcardIndex === MEDICAL_FLASHCARDS.length - 1}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40"
                >
                  <span>Thẻ tiếp theo</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: MEDICAL AI ASSISTANT */}
          {activeTab === 'ai_assistant' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    <Brain size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                      Giáo Sư / Cố Vấn Y Khoa AI Socratic
                    </h3>
                    <p className="text-stone-500 dark:text-stone-400">
                      Được huấn luyện đặc biệt để hướng dẫn sinh viên Y khoa tư duy biện luận lâm sàng
                    </p>
                  </div>
                </div>

                <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                  Thay vì chỉ cho đáp án ngay, AI đóng vai trò Giảng viên lâm sàng sẽ hỏi vặn từng bước, giúp bạn ghi nhớ cơ chế bệnh sinh, tra cứu dược thư, phân tích khí máu động mạch (ABG) và đọc điện tâm đồ (ECG) chuẩn Y văn.
                </p>

                <button
                  onClick={() => handleLaunchMedicalChat('consultant')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-all"
                >
                  <MessageSquare size={16} />
                  <span>Bắt đầu phiên học tập Y Khoa mới với AI</span>
                </button>
              </div>

              {/* Sample Quick Questions for Medical Students */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Chủ đề mẫu gợi ý để thảo luận cùng AI:
                </h4>
                {[
                  {
                    title: 'Phân tích Khí máu động mạch (ABG) từng bước',
                    desc: 'Quy tắc 6 bước xác định toan kiềm, tính khoảng trống Anion và bù trừ hô hấp/chuyển hóa.',
                    prompt: 'Thầy hãy hướng dẫn em quy tắc 6 bước đọc Khí máu động mạch (ABG) chuẩn mực và cho em 2 ca bài tập để em thử đọc nhé!',
                  },
                  {
                    title: 'Phân biệt Nhồi máu cơ tim ST chênh lên và Viêm màng ngoài tim',
                    desc: 'So sánh hình ảnh điện tâm đồ, đoạn PR chênh xuống, men tim và tiếng cọ màng ngoài tim.',
                    prompt: 'Thầy hãy giúp em phân biệt chi tiết giữa Nhồi máu cơ tim cấp có ST chênh lên (STEMI) và Viêm màng ngoài tim cấp trên cả lâm sàng và ECG nhé.',
                  },
                  {
                    title: 'Nguyên tắc lựa chọn Kháng sinh theo kinh nghiệm (Empiric Antibiotics)',
                    desc: 'Phổ kháng khuẩn, vi khuẩn Gr(+) Gr(-), kỵ khí và quy tắc xuống thang kháng sinh.',
                    prompt: 'Thầy hãy tóm tắt cho em nguyên tắc lựa chọn kháng sinh ban đầu theo kinh nghiệm trong Viêm phổi mắc phải cộng đồng và Nhiễm trùng ổ bụng nhé.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleLaunchMedicalChat('custom', item.prompt)}
                    className="p-3.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 cursor-pointer transition-all text-xs"
                  >
                    <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowRight size={13} className="text-emerald-500" />
                    </div>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
