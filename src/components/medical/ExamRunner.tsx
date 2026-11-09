import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Timer,
  CheckCircle2,
  XCircle,
  Brain,
  ChevronLeft,
  ChevronRight,
  Award,
  RotateCcw,
  Flag,
  Clock,
  FileText,
  Home,
} from 'lucide-react';
import { MedicalQuestion } from '../../types/medical';
import { getQuestionTypeLabel } from '../../data/questionTypes';

const LETTERS = 'ABCDEFGH';

export interface ExamRunOutcome {
  correctCount: number;
  questionCount: number;
  timeSpentSeconds: number;
  timedOut: boolean;
  answers: Record<string, number>;
}

interface ExamRunnerProps {
  questions: MedicalQuestion[];
  durationSeconds: number;      // 0 = không giới hạn (chế độ học tập)
  title: string;
  onFinish: (outcome: ExamRunOutcome) => void;
  onExit: () => void;
  onRestart: () => void;
}

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  questions,
  durationSeconds,
  title,
  onFinish,
  onExit,
  onRestart,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const [showNavigator, setShowNavigator] = useState(false);

  const startedAtRef = useRef<number>(Date.now());
  const finishedRef = useRef(false);

  const current = questions[currentIndex];
  const isTimed = durationSeconds > 0;

  const answeredCount = Object.keys(answers).length;

  const score = useMemo(() => {
    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }
    return correct;
  }, [answers, questions]);

  const finish = (timedOut: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsFinished(true);

    let correct = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct++;
    }

    onFinish({
      correctCount: correct,
      questionCount: questions.length,
      timeSpentSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
      timedOut,
      answers,
    });
  };

  // Đồng hồ đếm ngược cho chế độ tính giờ.
  useEffect(() => {
    if (!isTimed || isFinished) return;

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [isTimed, isFinished]);

  // Hết giờ -> tự nộp bài. Dùng effect riêng để không gọi finish trong setState.
  useEffect(() => {
    if (isTimed && timeLeft === 0 && !finishedRef.current) {
      finish(true);
    }
  }, [timeLeft, isTimed]);

  const handleSelect = (optionIndex: number) => {
    if (!current || isFinished) return;
    if (answers[current.id] !== undefined) return; // đã trả lời -> khóa lựa chọn
    setAnswers((prev) => ({ ...prev, [current.id]: optionIndex }));
  };

  if (!current) {
    return (
      <div className="p-6 text-center text-xs text-stone-500">
        Không có câu hỏi nào trong lượt làm bài này.
        <button onClick={onExit} className="ml-2 underline text-emerald-600">
          Quay lại
        </button>
      </div>
    );
  }

  const selected = answers[current.id];
  const isAnswered = selected !== undefined;
  const isCorrect = isAnswered && selected === current.correctIndex;

  const timeDanger = isTimed && timeLeft <= 60;

  return (
    <div className="space-y-4">
      {/* Thanh trạng thái */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-stone-850 border border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onExit}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            title="Thoát bài làm"
          >
            <Home size={15} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[240px]">
              {title}
            </p>
            <p className="text-[14px] text-stone-500">
              Đã trả lời {answeredCount}/{questions.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isTimed && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border ${
                timeDanger
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              }`}
              title="Thời gian còn lại"
            >
              <Timer size={14} />
              <span>{formatClock(timeLeft)}</span>
            </div>
          )}

          <button
            onClick={() => setShowNavigator((v) => !v)}
            className="px-2.5 py-1.5 rounded-xl text-[14px] font-semibold bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-750 transition-colors"
          >
            Sơ đồ câu
          </button>

          <button
            onClick={onRestart}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
            title="Trộn lại đề mới"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Sơ đồ câu hỏi */}
      {showNavigator && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const done = ans !== undefined;
            const ok = done && ans === q.correctIndex;

            let cls =
              'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400';
            if (done) {
              cls = ok
                ? 'bg-emerald-500 text-white'
                : 'bg-rose-500 text-white';
            }
            if (idx === currentIndex) cls += ' ring-2 ring-offset-1 ring-emerald-500 dark:ring-offset-stone-900';

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setShowNavigator(false);
                }}
                className={`w-7 h-7 rounded-lg text-[13px] font-bold transition-all ${cls}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      )}

      {/* Thẻ câu hỏi */}
      <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
            Câu {currentIndex + 1} / {questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold">
            {getQuestionTypeLabel(current.questionType)}
          </span>
          {current.sourceName && (
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium inline-flex items-center gap-1">
              <FileText size={11} />
              {current.sourceName}
            </span>
          )}
        </div>

        {current.vignette && (
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 text-xs text-stone-800 dark:text-stone-200 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-blue-700 dark:text-blue-300 mb-1">
              <FileText size={14} />
              <span>Tình huống lâm sàng:</span>
            </div>
            <p>{current.vignette}</p>
          </div>
        )}

        <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">
          {current.question}
        </h3>

        <div className="space-y-2">
          {current.options.map((option, optIdx) => {
            const isSelected = selected === optIdx;
            const correctOption = optIdx === current.correctIndex;

            let btnClass =
              'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-800 dark:text-stone-200';

            if (!isAnswered && isSelected) {
              btnClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium';
            } else if (isAnswered) {
              if (correctOption) {
                btnClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
              } else if (isSelected) {
                btnClass = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 font-medium';
              } else {
                btnClass = 'border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-500 opacity-70';
              }
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelect(optIdx)}
                disabled={isAnswered}
                className={`w-full text-left p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${btnClass} ${
                  isAnswered ? 'cursor-default' : 'cursor-pointer'
                }`}
              >
                <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[13px] shrink-0 mt-0.5">
                  {LETTERS[optIdx] || optIdx + 1}
                </span>
                <span className="flex-1 leading-relaxed">{option}</span>
                {isAnswered && correctOption && (
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                )}
                {isAnswered && isSelected && !correctOption && (
                  <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Đáp án + giải thích hiện ngay sau khi chọn */}
        {isAnswered && (
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in duration-150 ${
              isCorrect
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/60'
                : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60'
            }`}
          >
            <div
              className={`flex items-center gap-1.5 font-bold ${
                isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
              }`}
            >
              {isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              <span>
                {isCorrect ? 'Chính xác!' : 'Chưa đúng.'} Đáp án đúng:{' '}
                {LETTERS[current.correctIndex] || current.correctIndex + 1}.{' '}
                {current.options[current.correctIndex]}
              </span>
            </div>

            <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300 leading-relaxed">
              <Brain size={14} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <p>
                <strong>Giải thích: </strong>
                {current.explanation}
              </p>
            </div>

            {current.reference && (
              <div className="text-[14px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-stone-200/60 dark:border-stone-800">
                <strong>Nguồn:</strong> {current.reference}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Điều hướng */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
          disabled={currentIndex === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Câu trước</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-[14px] font-semibold text-stone-600 dark:text-stone-300">
            <Award size={13} className="text-amber-500" />
            <span>
              {score}/{questions.length} đúng
            </span>
          </div>

          {currentIndex === questions.length - 1 ? (
            <button
              onClick={() => finish(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Flag size={15} />
              <span>Nộp bài</span>
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:opacity-90 transition-opacity"
            >
              <span>Câu tiếp</span>
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {isTimed && (
        <p className="flex items-center justify-center gap-1.5 text-[14px] text-stone-400">
          <Clock size={12} />
          Hết giờ hệ thống tự nộp bài. Đáp án chỉ hiện sau khi bạn chọn.
        </p>
      )}
    </div>
  );
};
