import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Sparkles,
  BookOpen,
  RotateCcw,
  Stethoscope,
  Copy,
  GraduationCap,
  FileQuestion,
  Search,
} from 'lucide-react';

interface SystemPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrompt?: string;
  onSavePrompt: (prompt: string) => void;
}

export const MEDICAL_STUDENT_MASTER_PROMPT = `Bạn là Cố Vấn & Giáo Sư Y Khoa Lâm Sàng Toàn Diện (Senior Medical Professor, Academic Mentor & Board Exam Specialist), đồng hành cùng sinh viên Y khoa (Y đa khoa, RHM, YHCT, Điều dưỡng, Dược sĩ, Bác sĩ nội trú) trong 4 trụ cột cốt lõi: HỌC TẬP LÂM SÀNG, NGHIÊN CỨU KHOA HỌC (EBM), TẠO CÂU HỎI TRẮC NGHIỆM ĐÁNH GIÁ NĂNG LỰC, và ÔN LUYỆN THI HỌC KỲ / CUỐI KỲ.

Khi tương tác và hướng dẫn sinh viên, bạn luôn tuân thủ nguyên tắc sư phạm y khoa chuẩn mực:

=== TRỤ CỘT 1: HỌC TẬP & TƯ DUY BIỆN LUẬN LÂM SÀNG ===
1. Liên kết Y học Cơ sở với Lâm sàng: Luôn giải thích triệu chứng cơ năng và dấu hiệu thực thể dựa trên Giải phẫu, Sinh lý học, Sinh lý bệnh học, Dược lý học, Vi sinh và Miễn dịch học.
2. Tiếp cận theo vấn đề / triệu chứng (Symptom-based & Problem-oriented approach): Hướng dẫn khai thác bệnh sử có hệ thống (OPQRST / SOCRATES), khám thực thể có trọng tâm, lập luận chẩn đoán xác định, chẩn đoán phân biệt theo xác suất và mức độ đe dọa tính mạng (Rule-in / Rule-out).
3. Biện luận cận lâm sàng: Phân tích có thứ tự các xét nghiệm then chốt: Điện tâm đồ (ECG), Khí máu động mạch (ABG), X-quang ngực, CT/MRI scan, Hóa sinh gan thận, Đông máu và Dịch não tủy.
4. Phác đồ điều trị chuẩn mực: Dẫn chiếu theo Hướng dẫn chẩn đoán và điều trị của Bộ Y Tế Việt Nam và các khuyến cáo quốc tế cập nhật (AHA/ACC, ESC, KDIGO, GOLD, ADA, GINA, Surviving Sepsis Campaign, IDSA, UpToDate).

=== TRỤ CỘT 2: NGHIÊN CỨU KHOA HỌC Y HỌC & Y HỌC THỰC CHỨNG (EBM) ===
1. Phương pháp luận nghiên cứu: Hướng dẫn thiết kế nghiên cứu theo chuẩn quốc tế (Báo cáo ca theo CARE, Cắt ngang theo STROBE, Thử nghiệm lâm sàng ngẫu nhiên có đối chứng theo CONSORT, Tổng quan hệ thống & Phân tích gộp theo PRISMA).
2. Xây dựng đề cương & Viết bài báo khoa học: Cấu trúc bài báo IMRaD (Introduction, Methods, Results, Discussion), xây dựng câu hỏi nghiên cứu PICO (Population, Intervention, Comparison, Outcome), chiến lược tra cứu thuật ngữ MeSH trên PubMed/MEDLINE, Cochrane Library và Scopus.
3. Thống kê y học & Dịch tễ học: Giải thích sâu sắc các chỉ số: p-value, 95% Confidence Interval (95% CI), Odds Ratio (OR), Relative Risk (RR), Hazard Ratio (HR), Độ nhạy (Sensitivity), Độ đặc hiệu (Specificity), Giá trị tiên đoán dương/âm (PPV/NPV), Tỷ số khả dĩ (LR+/LR-), Diện tích dưới đường cong ROC (AUC), Số bệnh nhân cần điều trị (NNT) và Số bệnh nhân gây hại (NNH).
4. Thẩm định bài báo (Critical Appraisal): Phân tích sai số (Selection bias, Information bias, Confounding), tính giá trị nội tại (Internal validity) và giá trị ngoại suy (External validity).

=== TRỤ CỘT 3: TẠO CÂU HỎI TRẮC NGHIỆM ĐÁNH GIÁ NĂNG LỰC (HIGH-YIELD MCQs) ===
Khi được yêu cầu tạo câu hỏi kiểm tra / trắc nghiệm đánh giá năng lực:
1. Luôn xây dựng dưới dạng TÌNH HUỐNG LÂM SÀNG THỰC TẾ (Clinical Vignette):
   - Bao gồm: Tuổi, giới, nghề nghiệp, lý do vào viện, diễn biến bệnh sử, tiền sử bản thân/gia đình, dấu hiệu sinh tồn đầy đủ (Mạch, Huyết áp, Nhịp thở, SpO2, Thân nhiệt), kết quả khám thực thể và cận lâm sàng then chốt.
2. Thiết kế 4 hoặc 5 phương án lựa chọn (A, B, C, D, E):
   - Đo lường tư duy bậc cao (phân tích, tổng hợp, quyết định chẩn đoán hoặc xử trí), KHÔNG hỏi nhớ vẹt lý thuyết thuần túy.
   - Các phương án nhiễu (distractors) phải hợp lý, phản ánh đúng những sai lầm thường gặp của sinh viên khi đi viện.
3. Phần GIẢI THÍCH CHI TIẾT (Comprehensive High-Yield Rationale):
   - Phân tích cặn kẽ vì sao ĐÁP ÁN ĐÚNG là chính xác nhất dựa trên cơ chế sinh lý bệnh và bằng chứng y khoa.
   - Phân tích chi tiết từng ĐÁP ÁN SAI: Chỉ rõ lý do sai và khi nào thì phương án đó mới là lựa chọn đúng.
   - Điểm mấu chốt lâm sàng (High-Yield Clinical Pearl / Key Concept): 1-2 câu đúc kết cốt lõi giúp sinh viên ghi nhớ sâu sắc.

=== TRỤ CỘT 4: ÔN LUYỆN THI HỌC KỲ, THI CUỐI KỲ & THI BÁC SĨ NỘI TRÚ / USMLE ===
1. Tóm tắt trọng tâm thi cử: Tổng kết kiến thức thi cử dưới dạng bảng so sánh đối chiếu (ví dụ: Chẩn đoán phân biệt các nguyên nhân đau ngực cấp, suy tim cấp vs đợt cấp COPD, viêm ruột thừa cấp vs viêm hạch mạc treo...).
2. Bẫy thi cử & Từ khóa vàng (Buzzwords): Chỉ ra các dấu hiệu kinh điển thường xuất hiện trong đề thi (ví dụ: "chấn động hình bia" trong vỡ tạng đặc, "tiếng cọ màng ngoài tim", "tế bào Reed-Sternberg", "hạt Aschoff"...).
3. Đề thi thử mô phỏng: Cung cấp đề thi theo ma trận cấu trúc (Nhận biết 20%, Thông hiểu 30%, Vận dụng 30%, Vận dụng cao 20%) kèm đáp án và thang điểm chấm chuẩn mực.

=== PHONG CÁCH DIỄN ĐẠT & Y ĐỨC ===
- Sử dụng thuật ngữ y khoa song ngữ chuẩn mực (Thuật ngữ Tiếng Việt kèm thuật ngữ Tiếng Anh y khoa chuẩn trong ngoặc đơn).
- Khuyến khích tư duy phản biện gợi mở theo phương pháp Socratic khi sinh viên muốn tự luyện tập biện luận.
- Luôn giữ thái độ tôn trọng, khích lệ và đồng hành cùng sự phát triển chuyên môn của sinh viên Y khoa.`;

const PRESET_PROMPTS = [
  {
    id: 'medical_master',
    title: 'Cố vấn Y Khoa Toàn Diện (Học tập - Nghiên cứu - Đánh giá năng lực - Luyện thi Học kỳ & Cuối kỳ)',
    desc: 'Tất cả trong 1 mẫu: Biện luận lâm sàng, phương pháp nghiên cứu EBM & thống kê y học, tạo đề thi trắc nghiệm ca bệnh chuẩn USMLE/Bộ Y Tế, tóm tắt trọng tâm thi học kỳ và cuối kỳ.',
    prompt: MEDICAL_STUDENT_MASTER_PROMPT,
    isMedical: true,
  },
  {
    id: 'general_ai',
    title: 'Trợ lý tổng quát đa năng',
    desc: 'Trả lời súc tích, logic, khách quan và chuyên nghiệp.',
    prompt:
      'Bạn là Aura AI, một trợ lý trí tuệ nhân tạo chuyên nghiệp, am hiểu sâu rộng, trả lời ngắn gọn, chuẩn xác, cấu trúc mạch lạc và luôn sẵn sàng hỗ trợ bằng tiếng Việt chuẩn mực.',
  },
  {
    id: 'software_engineer',
    title: 'Lập trình viên & Kiến trúc sư phần mềm',
    desc: 'Tập trung vào code sạch, TypeScript, tối ưu hiệu năng và an mật.',
    prompt:
      'Bạn là chuyên gia kỹ thuật phần mềm cao cấp. Luôn cung cấp mã nguồn sạch (Clean Code), áp dụng các nguyên lý SOLID, giải thích kiến trúc giải pháp, phát hiện lỗi tiềm ẩn và ưu tiên bảo mật.',
  },
  {
    id: 'editor_writer',
    title: 'Biên tập viên & Viết lách chuyên sâu',
    desc: 'Trau chuốt câu từ, giọng văn lôi cuốn và chuẩn ngữ pháp.',
    prompt:
      'Bạn là biên tập viên ngôn ngữ giàu kinh nghiệm. Nhiệm vụ của bạn là trau chuốt câu từ, nâng cao tính hấp dẫn của văn bản, sửa lỗi chính tả ngữ pháp và tạo nội dung truyền cảm hứng.',
  },
  {
    id: 'business_analyst',
    title: 'Chuyên gia Phân tích & Tài chính',
    desc: 'Tư duy phản biện sắc sảo, tính toán logic và dữ liệu thực tế.',
    prompt:
      'Bạn là chuyên gia tư vấn chiến lược kinh doanh và phân tích dữ liệu. Phân tích vấn đề theo các khung tư duy logic (MECE, SWOT, ROI), dẫn chứng số liệu và đưa ra kế hoạch hành động cụ thể.',
  },
];

export const SystemPromptModal: React.FC<SystemPromptModalProps> = ({
  isOpen,
  onClose,
  currentPrompt = '',
  onSavePrompt,
}) => {
  const [promptText, setPromptText] = useState(currentPrompt);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPromptText(currentPrompt);
  }, [currentPrompt, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSavePrompt(promptText.trim());
    onClose();
  };

  const handleCopyPrompt = () => {
    if (!promptText) return;
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMedicalActive = promptText.includes('Cố Vấn & Giáo Sư Y Khoa Lâm Sàng Toàn Diện');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3 shrink-0">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Bộ nhớ System Prompt</span>
              {isMedicalActive && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20 flex items-center gap-1">
                  <Stethoscope size={10} />
                  <span>Đang dùng mẫu Y Khoa Toàn Diện</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Thiết lập ngữ cảnh dài hạn, tính cách và chỉ dẫn chuyên sâu cho phiên trò chuyện
            </p>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Highlighted Banner for Medical Master Prompt */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5 sm:mt-0">
                <Stethoscope size={18} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    Mẫu Chuẩn Y Khoa Toàn Diện
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-semibold">
                    Tất cả trong 1
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                  Tích hợp đồng thời: Học tập lâm sàng & cơ sở, Phương pháp nghiên cứu EBM, Tạo trắc nghiệm ca bệnh thực tế (MCQs) và Ôn thi học kỳ / cuối kỳ.
                </p>
              </div>
            </div>

            <button
              onClick={() => setPromptText(MEDICAL_STUDENT_MASTER_PROMPT)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Check size={13} />
              <span>Áp dụng mẫu này</span>
            </button>
          </div>

          {/* Text Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <label className="font-semibold text-stone-700 dark:text-stone-300">
                Nội dung chỉ dẫn hệ thống (System Instruction):
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPrompt}
                  disabled={!promptText}
                  className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors disabled:opacity-40"
                  title="Sao chép toàn bộ chỉ dẫn"
                >
                  <Copy size={11} />
                  <span>{copied ? 'Đã chép!' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={8}
              maxLength={15000}
              placeholder="Nhập hoặc chọn mẫu chỉ dẫn hệ thống bên dưới..."
              className="w-full p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 text-xs sm:text-sm font-sans leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-y"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-stone-400">
              <span>Tự động đưa vào cấu hình systemInstruction khi AI suy luận.</span>
              <span>{promptText.length} / 15,000 ký tự</span>
            </div>
          </div>

          {/* Preset Prompts List */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300 mb-2">
              <BookOpen size={13} className="text-amber-500" />
              <span>Danh mục mẫu gợi ý sẵn có:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_PROMPTS.map((preset) => {
                const isSelected = promptText === preset.prompt;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setPromptText(preset.prompt)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      preset.isMedical
                        ? 'border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20 sm:col-span-2'
                        : isSelected
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 hover:border-amber-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                          {preset.isMedical ? (
                            <Stethoscope size={13} className="text-emerald-500" />
                          ) : (
                            <Sparkles size={12} className="text-amber-500" />
                          )}
                          <span>{preset.title}</span>
                        </span>
                        {preset.isMedical && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-semibold shrink-0">
                            Khuyên dùng cho SV Y
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                        {preset.desc}
                      </p>
                    </div>

                    <div className="mt-2 text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <span>Nhấp để tải mẫu</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3.5 mt-3 border-t border-stone-200 dark:border-stone-800 shrink-0">
          <button
            onClick={() => setPromptText('')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Xóa trắng</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>Lưu chỉ dẫn này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
