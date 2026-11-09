import { MedicalQuestion } from '../types/medical';

export const MEDICAL_QUESTIONS: MedicalQuestion[] = [
  // 1. NỘI KHOA (Tim mạch - Cấp cứu)
  {
    id: 'med_q1',
    specialty: 'internal',
    examCategory: 'competency',
    difficulty: 'hard',
    vignette: 'Bệnh nhân nam 58 tuổi, tiền sử hút thuốc lá 30 gói-năm và đái tháo đường type 2, vào cấp cứu vì đau thắt ngực dữ dội sau xương ức kéo dài 45 phút, lan lên hàm dưới và mặt trong cánh tay trái, vã mồ hôi, khó thở. Huyết áp 140/90 mmHg, mạch 95 lần/phút. Điện tâm đồ (ECG) ghi nhận đoạn ST chênh lên dạng vòm > 2.5 mm ở các chuyển đạo V1-V4, kèm sóng Q hoại tử nhỏ.',
    question: 'Chẩn đoán xác định và chiến lược tái tưới máu ưu tiên hàng đầu theo khuyến cáo hiện hành là gì?',
    options: [
      'Nhồi máu cơ tim không ST chênh lên (NSTEMI); chụp mạch vành trì hoãn trong vòng 72 giờ.',
      'Nhồi máu cơ tim cấp có ST chênh lên (STEMI) thành trước; can thiệp mạch vành qua da (PCI) thì đầu nếu thời gian từ cửa đến bóng (door-to-balloon) < 120 phút.',
      'Viêm màng ngoài tim cấp; điều trị kháng viêm Colchicine và Aspirin liều cao.',
      'Cơn đau thắt ngực không ổn định; điều trị nội khoa bảo tồn với chẹn beta và ức chế men chuyển.'
    ],
    correctIndex: 1,
    explanation: 'Bệnh nhân có bệnh cảnh kinh điển của STEMI thành trước (ST chênh lên ở V1-V4 do tắc động mạch liên thất trước LAD). Theo hướng dẫn của ESC/ACC/AHA và Bộ Y Tế, chiến lược tái tưới máu ưu tiên hàng đầu là can thiệp mạch vành qua da (Primary PCI) thì đầu với mục tiêu thời gian cửa - bóng (Door-to-Balloon) < 90-120 phút. Nếu không thể chuyển viện PCI kịp trong 120 phút, mới xem xét tiêu sợi huyết (Fibrinolysis) trong 10 phút đầu.',
    reference: 'Harrison\'s Principles of Internal Medicine (21st Ed) & Hướng dẫn Chẩn đoán và Xử trí Hội Tim Mạch Việt Nam / Bộ Y Tế.'
  },

  // 2. NỘI KHOA (Hô hấp)
  {
    id: 'med_q2',
    specialty: 'internal',
    examCategory: 'semester',
    difficulty: 'medium',
    vignette: 'Bệnh nhân nam 67 tuổi, tiền sử COPD nhóm E đang điều trị LABA + LAMA + ICS. Vào viện vì khó thở tăng dần, sốt 38.5°C, ho khạc đờm nhiều màu xanh đục và chuyển sang dạng mủ trong 2 ngày qua. Khám: thở co kéo cơ hô hấp phụ, SpO2 88% khí phòng, ran ngáy và ran rít rải rác hai phế trường.',
    question: 'Theo phân loại tiêu chuẩn Anthonisen, bệnh nhân này thuộc đợt cấp COPD mức độ nào và chỉ định kháng sinh ra sao?',
    options: [
      'Mức độ III (Nhẹ); không cần chỉ định kháng sinh, chỉ cần tăng liều thuốc giãn phế quản khí dung.',
      'Mức độ II (Trung bình); chỉ cần theo dõi và dùng corticoid đường uống.',
      'Mức độ I (Nặng - có đủ 3 triệu chứng: tăng khó thở, tăng thể tích đờm, đờm mủ); có chỉ định bắt buộc sử dụng kháng sinh.',
      'Chỉ là nhiễm siêu vi đường hô hấp trên, duy trì đơn thuốc cũ.'
    ],
    correctIndex: 2,
    explanation: 'Tiêu chuẩn Anthonisen định nghĩa đợt cấp COPD type 1 (Nặng) khi có đủ 3 triệu chứng: (1) Khó thở tăng, (2) Thể tích đờm tăng, (3) Đờm đổi màu/mủ hóa. Khi có triệu chứng đờm mủ (hoặc đợt cấp type 1 hoặc bệnh nhân thở máy), chỉ định dùng kháng sinh là bắt buộc (ví dụ: Amoxicillin-Clavulanate, Cefuroxime hoặc Fluoroquinolone hô hấp). Ngoài ra cần tối ưu thuốc giãn phế quản tác dụng ngắn SABA + SAMA và Glucocorticoid toàn thân 5 ngày (GOLD 2024).',
    reference: 'GOLD Report 2024 (Global Initiative for Chronic Obstructive Lung Disease) & Hướng dẫn BYT.'
  },

  // 3. NGOẠI KHOA (Bụng cấp cứu)
  {
    id: 'med_q3',
    specialty: 'surgery',
    examCategory: 'final',
    difficulty: 'medium',
    vignette: 'Bệnh nhân nữ 24 tuổi, khởi phát đau bụng âm ỉ vùng thượng vị cách 14 giờ, sau đó 6 giờ đau khu trú rõ rệt về hố chậu phải, kèm buồn nôn và sốt 38°C. Khám thấy bụng mềm, ấn đau chói tại điểm McBurney, dấu hiệu Blumberg (+) và dấu hiệu Rovsing (+). Bạch cầu máu 14.500/uL (Neu 82%).',
    question: 'Dấu hiệu Rovsing dương tính trong khám bụng ngoại khoa được xác định như thế nào và có ý nghĩa gì?',
    options: [
      'Gõ đục vùng thấp; gợi ý có dịch tự do trong ổ phúc mạc.',
      'Ấn vào hố chậu trái gây đau tăng ở hố chậu phải; do dồn hơi trong khung đại tràng làm căng dãn manh tràng và ruột thừa viêm.',
      'Bệnh nhân co chân phải làm căng cơ thắt lưng chậu gây đau; gợi ý ruột thừa sau manh tràng.',
      'Ấn nhẹ hạ sườn phải làm bệnh nhân nín thở; gợi ý viêm túi mật cấp.'
    ],
    correctIndex: 1,
    explanation: 'Dấu hiệu Rovsing (+) là khi người khám ấn sâu vào hố chậu trái, áp lực dồn khí ngược theo khung đại tràng (đại tràng xuống -> đại tràng ngang -> đại tràng lên -> manh tràng), làm tăng áp lực tại manh tràng và ruột thừa đang viêm ở hố chậu phải gây đau nhói. Đây là dấu hiệu có giá trị cao củng cố chẩn đoán Viêm ruột thừa cấp.',
    reference: 'Sabiston Textbook of Surgery (21st Ed) & Giáo trình Bệnh học Ngoại khoa Đại học Y Hà Nội / ĐHYD TP.HCM.'
  },

  // 4. DƯỢC LÝ HỌC (Thuốc tim mạch)
  {
    id: 'med_q4',
    specialty: 'pharmacology',
    examCategory: 'semester',
    difficulty: 'medium',
    question: 'Thuốc ức chế men chuyển (ACE inhibitors như Enalapril, Lisinopril) thường gây ra tác dụng phụ ho khan kéo dài ở khoảng 5-20% bệnh nhân. Cơ chế phân tử chính gây ra tác dụng phụ này là do:',
    options: [
      'Kích thích trực tiếp các thụ thể Beta-2 giao cảm tại biểu mô phế quản.',
      'Ức chế gián tiếp sự thoái giáng của Bradykinin và Substance P tại đường hô hấp, dẫn đến tích tụ và kích thích phản xạ ho.',
      'Gây ứ đọng dịch nhầy do tăng tiết Histamin nội sinh tại tiểu phế quản tận.',
      'Gây hạ huyết áp quá mức dẫn đến co thắt mạch máu phổi phản xạ.'
    ],
    correctIndex: 1,
    explanation: 'Men chuyển Angiotensin (ACE) không chỉ chuyển Angiotensin I thành Angiotensin II, mà bản chất nó còn là Kininase II - một enzym xúc tác phân hủy Bradykinin và Substance P. Khi dùng thuốc ức chế men chuyển (ACEi), Kininase II bị ức chế dẫn đến Bradykinin và Substance P tích tụ tại phế quản và phổi, kích thích các sợi thần kinh cảm giác C gây ho khan dai dẳng không đáp ứng thuốc giảm ho thông thường. Khắc phục: đổi sang nhóm Chẹn thụ thể Angiotensin II (ARB) như Losartan/Valsartan vì ARB không can thiệp Kininase II.',
    reference: 'Katzung\'s Basic and Clinical Pharmacology (15th Ed).'
  },

  // 5. NHI KHOA (Sốt co giật)
  {
    id: 'med_q5',
    specialty: 'pediatrics',
    examCategory: 'final',
    difficulty: 'medium',
    vignette: 'Bé trai 18 tháng tuổi được mẹ đưa vào cấp cứu vì co giật trong cơn sốt cao 39.5°C do viêm họng cấp. Cơn giật toàn thể cơn trương lực - giật rung kéo dài khoảng 2 phút rồi tự dứt. Sau cơn trẻ khóc to, tỉnh táo, đồng tử đều 2 bên, thóp phẳng, không có dấu hiệu cổ gượng hay dấu thần kinh khu trú. Tiền sử chưa từng co giật trước đây.',
    question: 'Tình trạng của bé được chẩn đoán là gì và thái độ xử trí tiếp theo phù hợp nhất là gì?',
    options: [
      'Động kinh tiên phát; chỉ định chụp MRI não và dùng thuốc chống động kinh dài hạn Acid Valproic.',
      'Viêm màng não mủ; bắt buộc phải chọc dò tủy sống ngay lập tức và dùng kháng sinh liều cao đường tĩnh mạch.',
      'Co giật do sốt đơn thuần (Simple febrile seizure); hạ sốt tích cực, giải thích trấn an gia đình, tìm ổ nhiễm trùng và không có chỉ định dùng thuốc chống động kinh dự phòng.',
      'Hạ calci máu nặng do còi xương; tiêm tĩnh mạch Calci Clorid cấp cứu.'
    ],
    correctIndex: 2,
    explanation: 'Co giật do sốt đơn thuần (Simple febrile seizure) đặc trưng bởi: xảy ra ở lứa tuổi 6 tháng - 5 tuổi, cơn giật toàn thể, thời gian < 15 phút, không tái phát trong vòng 24 giờ, trẻ tỉnh táo hoàn toàn sau cơn và không có dấu hiệu thần kinh khu trú hay viêm màng não. Tiên lượng rất lành tính, không để lại di chứng thần kinh và không tăng nguy cơ động kinh về sau. Xử trí chủ yếu là hạ sốt (Paracetamol 10-15 mg/kg), bù nước điện giải và điều trị ổ nhiễm trùng gây sốt.',
    reference: 'Nelson Textbook of Pediatrics (21st Ed) & Hướng dẫn Chẩn đoán và Điều trị Nhi khoa Bộ Y Tế.'
  },

  // 6. SẢN - PHỤ KHOA (Tiền sản giật)
  {
    id: 'med_q6',
    specialty: 'obgyn',
    examCategory: 'competency',
    difficulty: 'hard',
    vignette: 'Sản phụ 32 tuổi, mang thai con so 34 tuần, vào khám thai định kỳ thấy huyết áp đo 2 lần cách nhau 4 giờ là 165/110 mmHg. Sản phụ than phiền đau đầu nhiều vùng trán, hoa mắt nhìn mờ và đau tức hạ sườn phải. Xét nghiệm nước tiểu: Protein niệu que nhúng 3+ (3.5 g/24h). Tiểu cầu: 85.000/uL, Men gan AST 180 U/L, ALT 210 U/L.',
    question: 'Chẩn đoán xác định và thuốc chống co giật đầu tay được khuyến cáo sử dụng là gì?',
    options: [
      'Tăng huyết áp thai kỳ; dùng Diazepam đường tĩnh mạch để an thần.',
      'Tiền sản giật có dấu hiệu nặng (kèm hội chứng HELLP một phần); dùng Magnesi Sulfat (MgSO4) để dự phòng cơn sản giật.',
      'Sản giật giai đoạn tiềm tàng; dùng Phenytoin truyền tĩnh mạch liên tục.',
      'Viêm gan cấp do virus ở phụ nữ có thai; dùng Paracetamol hạ sốt giảm đau.'
    ],
    correctIndex: 1,
    explanation: 'Sản phụ có thai > 20 tuần, huyết áp >= 160/110 mmHg, protein niệu dương tính kèm các dấu hiệu tổn thương cơ quan đích (đau đầu nhìn mờ, đau hạ sườn phải, giảm tiểu cầu < 100k, tăng men gan > 2 lần) -> Tiền sản giật có dấu hiệu nặng (Severe Preeclampsia). Thuốc được lựa chọn hàng đầu trên toàn thế giới để dự phòng và điều trị cơn co giật sản giật là Magnesium Sulfate (MgSO4) theo phác đồ Pritchard hoặc Zuspan, vượt trội hoàn toàn so với Diazepam hoặc Phenytoin.',
    reference: 'Williams Obstetrics (26th Ed) & Hướng dẫn Quốc gia về các Dịch vụ Chăm sóc Sức khỏe Sinh sản - Bộ Y Tế.'
  },

  // 7. SINH LÝ HỌC (Thận & Thăng bằng Toan kiềm)
  {
    id: 'med_q7',
    specialty: 'physiology',
    examCategory: 'semester',
    difficulty: 'hard',
    vignette: 'Khí máu động mạch của một bệnh nhân đái tháo đường type 1 bỏ tiêm insulin có kết quả: pH = 7.18, PaCO2 = 22 mmHg, HCO3- = 8 mmol/L, Na+ = 135 mmol/L, Cl- = 95 mmol/L, Đường huyết = 28 mmol/L.',
    question: 'Phân tích rối loạn thăng bằng toan kiềm trên cho thấy tình trạng nào sau đây?',
    options: [
      'Toan hô hấp mất bù hoàn toàn.',
      'Kiềm chuyển hóa kết hợp toan hô hấp.',
      'Toan chuyển hóa tăng khoảng trống Anion (Anion Gap tăng) có bù trừ bằng hô hấp (thông khí tăng làm giảm PaCO2).',
      'Toan chuyển hóa có khoảng trống Anion bình thường (Normal Anion Gap Metabolic Acidosis).'
    ],
    correctIndex: 2,
    explanation: '1) pH = 7.18 (< 7.35) -> Toan máu. 2) HCO3- = 8 mmol/L (< 22) -> Toan chuyển hóa. 3) Tính khoảng trống Anion (Anion Gap) = Na+ - (Cl- + HCO3-) = 135 - (95 + 8) = 32 mmol/L (> 12 mmol/L) -> Toan chuyển hóa tăng Anion Gap (do tích tụ acid keto: acetoacetate, beta-hydroxybutyrate trong DKA). 4) PaCO2 = 22 mmHg (< 35 mmHg) là do cơ thể bù trừ bằng cách thở sâu nhanh kiểu Kussmaul để đào thải CO2.',
    reference: 'Guyton and Hall Textbook of Medical Physiology (14th Ed).'
  },

  // 8. GIẢI PHẪU HỌC (Hệ Thần Kinh)
  {
    id: 'med_q8',
    specialty: 'anatomy',
    examCategory: 'semester',
    difficulty: 'medium',
    vignette: 'Một bệnh nhân bị gãy kín 1/3 giữa xương cánh tay. Sau chấn thương, khám thấy bệnh nhân bị mất khả năng duỗi cổ tay và duỗi các ngón tay, tạo nên tư thế "bàn tay rũ cổ cò" (wrist drop), kèm mất cảm giác mặt mu đốt bàn ngón 1, 2 và nửa ngoài ngón 3.',
    question: 'Dây thần kinh nào chạy trong rãnh xoắn xương cánh tay đã bị tổn thương trong trường hợp này?',
    options: [
      'Dây thần kinh trụ (Ulnar nerve).',
      'Dây thần kinh giữa (Median nerve).',
      'Dây thần kinh quay (Radial nerve).',
      'Dây thần kinh nách (Axillary nerve).'
    ],
    correctIndex: 2,
    explanation: 'Dây thần kinh quay (Radial nerve) xuất phát từ bó sau đám rối cánh tay, đi cùng động mạch cánh tay sâu trong rãnh thần kinh quay (rãnh xoắn) ở mặt sau xương cánh tay. Do tiếp xúc sát màng xương, gãy 1/3 giữa thân xương cánh tay rất dễ làm giập hoặc đứt dây thần kinh quay, gây liệt nhóm cơ duỗi cẳng tay và bàn tay dẫn đến dấu hiệu "bàn tay rũ cổ cò" kinh điển.',
    reference: 'Netter\'s Atlas of Human Anatomy & Giải phẫu người (GS. Trịnh Văn Minh / GS. Nguyễn Quang Quyền).'
  },

  // 9. CẤP CỨU & HỒI SỨC (Sốc phản vệ)
  {
    id: 'med_q9',
    specialty: 'emergency',
    examCategory: 'competency',
    difficulty: 'hard',
    vignette: 'Bệnh nhân nam 35 tuổi, đang được truyền tĩnh mạch kháng sinh Cefriaxone tại phòng khám thì xuất hiện cảm giác ngứa toàn thân, đỏ da bừng mặt, thở rít thanh quản nghe thấy từ xa, SpO2 tụt còn 84%, huyết áp tụt nhanh xuống 70/40 mmHg, mạch nhanh nhỏ 130 lần/phút.',
    question: 'Xử trí đầu tay quan trọng nhất mang tính sống còn theo Thông tư 51/2017/TT-BYT là gì?',
    options: [
      'Tiêm tĩnh mạch chậm 1 ống Hydrocortisone 100mg và Diphenhydramine 10mg.',
      'Ngừng ngay đường truyền dị nguyên, tiêm bắp ngay lập tức Adrenalin (Epinephrine) 1mg/1ml liều 1/2 ống (0.5mg) vào mặt trước ngoài đùi.',
      'Đặt nội khí quản ngay lập tức trước khi dùng bất kỳ thuốc gì.',
      'Truyền nhanh 2000 ml dung dịch NaCl 0.9% và chờ đáp ứng trong 15 phút.'
    ],
    correctIndex: 1,
    explanation: 'Bệnh nhân có triệu chứng hô hấp (thở rít thanh quản) và tuần hoàn (tụt huyết áp) sau khi tiếp xúc dị nguyên -> Phản vệ độ III (nguy kịch). Theo Thông tư 51/2017/TT-BYT, Adrenalin tiêm bắp ngay lập tức ở mặt trước ngoài đùi là thuốc thiết yếu duy nhất cứu sống bệnh nhân (tác dụng kích thích alpha-1 co mạch nâng huyết áp, beta-1 tăng co bóp cơ tim, beta-2 giãn phế quản và ức chế giải phóng bọng hạt dưỡng bào). Corticoid và Kháng Histamin là thuốc hàng hai, tuyệt đối không được trì hoãn tiêm Adrenalin.',
    reference: 'Thông tư 51/2017/TT-BYT về Hướng dẫn phòng, chẩn đoán và xử trí phản vệ & Anaphylaxis Guidelines (WAO/ERC).'
  },

  // 10. GIẢI PHẪU BỆNH & MIỄN DỊCH
  {
    id: 'med_q10',
    specialty: 'pathology',
    examCategory: 'final',
    difficulty: 'hard',
    question: 'Hình ảnh mô bệnh học kinh điển của U hạt lao (Tuberculous Granuloma) bao gồm trung tâm hoại tử bã đậu được bao quanh bởi tế bào lympho, tế bào dạng biểu mô (Epithelioid cells) và tế bào khổng lồ nhiều nhân đặc trưng nào sau đây?',
    options: [
      'Tế bào khổng lồ đa nhân Sternberg-Reed.',
      'Tế bào khổng lồ Langhans với các nhân xếp hình móng ngựa ở ngoại vi tế bào.',
      'Tế bào bọt (Foam cells) chứa lipid.',
      'Tế bào khổng lồ dị vật (Foreign-body giant cells) với nhân nằm rải rác lộn xộn trong bào tương.'
    ],
    correctIndex: 1,
    explanation: 'U hạt lao (Nang lao) có cấu trúc vi thể đặc trưng gồm: trung tâm là chất hoại tử bã đậu (caseous necrosis), bao quanh bởi tế bào bán liên (dạng biểu mô), tế bào lympho T, và đại thực bào biến đổi thành Tế bào khổng lồ Langhans (Langhans giant cells) với nhân sắp xếp hình vòng cung hoặc hình móng ngựa ở vùng ngoại vi tế bào. Phân biệt với tế bào Sternberg-Reed trong u lympho Hodgkin (mắt cú).',
    reference: 'Robbins & Cotran Pathologic Basis of Disease (10th Ed).'
  }
];
