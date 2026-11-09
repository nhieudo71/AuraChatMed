import { ClinicalCase } from '../types/medical';

export const CLINICAL_CASES: ClinicalCase[] = [
  {
    id: 'case_1',
    title: 'Bệnh nhân nam 62 tuổi đau thắt ngực cấp giờ thứ 2',
    specialty: 'internal',
    difficulty: 'Trung bình',
    age: 62,
    gender: 'Nam',
    chiefComplaint: 'Đau thắt ngực trái dữ dội kèm vã mồ hôi và khó thở.',
    historyOfPresentIllness: 'Cách nhập viện 2 giờ, khi đang leo cầu thang, bệnh nhân đột ngột cảm thấy đau đè nghẹt sau xương ức, cảm giác như đá đè, lan lên cằm và vai trái. Đau kéo dài liên tục không đỡ khi nghỉ ngơi, kèm cảm giác hồi hộp, buồn nôn và vã mồ hôi lạnh toàn thân.',
    pastMedicalHistory: 'Tăng huyết áp 8 năm (uống Amlodipine 5mg không đều), Rối loạn lipid máu, Hút thuốc lá 40 gói-năm.',
    vitalSigns: {
      bloodPressure: '150/95 mmHg',
      heartRate: 98,
      respiratoryRate: 22,
      temperature: 36.8,
      spo2: 95,
    },
    physicalExamFindings: [
      'Bệnh nhân tỉnh, tiếp xúc được, vẻ mặt lo âu, niêm mạc hồng nhạt, vã mồ hôi trán và lưng.',
      'Tim đều, T1 T2 rõ, nghe thấy tiếng T4 nhẹ ở mỏm tim, không âm thổi bệnh lý.',
      'Phổi thông khí đều 2 bên, không có ran ẩm ở hai đáy phổi (Killip I).',
      'Bụng mềm, gan lách không to, không phù hai chi dưới, mạch ngoại vi bắt rõ.'
    ],
    paraclinicalResults: [
      {
        name: 'Điện tâm đồ (ECG 12 chuyển đạo)',
        result: 'Nhịp xoang 98 ck/p. Đoạn ST chênh lên dạng vòm 3.5mm ở V2, V3, V4, V5 kèm hình ảnh soi gương ST chênh xuống ở DII, DIII, aVF.',
        interpretation: 'Nhồi máu cơ tim cấp có ST chênh lên (STEMI) thành trước rộng giờ thứ 2.',
      },
      {
        name: 'Troponin T siêu nhạy (hs-cTnT)',
        result: '820 ng/L',
        normalRange: '< 14 ng/L',
        interpretation: 'Tổn thương hoại tử cơ tim cấp tính rõ rệt.',
      },
      {
        name: 'Siêu âm tim tại giường (Point-of-Care Echo)',
        result: 'Giảm động rõ vùng mỏm và thành trước thất trái. LVEF ước tính 45%. Không có tràn dịch màng ngoài tim.',
        interpretation: 'Rối loạn vận động vùng cơ tim tương ứng vùng cấp máu động mạch liên thất trước (LAD).',
      }
    ],
    differentialDiagnoses: [
      'Bóc tách động mạch chủ ngực cấp (Stanford type A)',
      'Thuyên tắc động mạch phổi cấp tính (PE)',
      'Viêm màng ngoài tim cấp tính',
      'Thủng tạng rỗng hoặc viêm tụy cấp thể đau ngực'
    ],
    definitiveDiagnosis: 'Nhồi máu cơ tim cấp có ST chênh lên thành trước rộng giờ thứ 2 - Killip I - Nguy cơ rất cao.',
    treatmentProtocol: [
      'Bất động tại giường, thở oxy nếu SpO2 < 90%.',
      'Thuốc kháng kết tập tiểu cầu kép (DAPT): Aspirin 300mg nhai nuốt + Ticagrelor 180mg (hoặc Clopidogrel 600mg) uống ngay.',
      'Thuốc chống đông: Enoxaparin 30mg tiêm tĩnh mạch + 1mg/kg tiêm dưới da (hoặc Heparin không phân đoạn).',
      'Giảm đau ngực: Nitroglycerin ngậm dưới lưỡi hoặc truyền tĩnh mạch (lưu ý tránh tụt HA), Morphin sulfat 2-4mg TM nếu đau nhiều.',
      'Kích hoạt phòng Can thiệp tim mạch (Cathlab) khẩn cấp để chụp và can thiệp mạch vành qua da thì đầu (Primary PCI).'
    ],
    clinicalPearls: 'Trong STEMI, "Thời gian là cơ tim" (Time is Muscle). Mục tiêu tái tưới máu qua da là < 90 phút từ khi tiếp cận y tế. Luôn loại trừ bóc tách động mạch chủ (huyết áp 2 tay chênh lệch, đau xé sau lưng) trước khi dùng thuốc chống đông và tiêu sợi huyết.'
  },
  {
    id: 'case_2',
    title: 'Bệnh nhân nữ 26 tuổi đau hố chậu phải sốt nhẹ',
    specialty: 'surgery',
    difficulty: 'Cơ bản',
    age: 26,
    gender: 'Nữ',
    chiefComplaint: 'Đau bụng âm ỉ tăng dần vùng hố chậu phải kèm sốt nhẹ.',
    historyOfPresentIllness: 'Bệnh khởi phát khoảng 18 giờ trước với cảm giác đau mơ hồ âm ỉ quanh rốn kèm chán ăn và buồn nôn 1 lần ra thức ăn cũ. Sau 8 giờ, cơn đau khu trú rõ rệt về hố chậu phải, đau liên tục tăng lên khi ho hoặc bước đi.',
    pastMedicalHistory: 'Chưa phẫu thuật vùng bụng. Kinh nguyệt đều, kỳ kinh cuối cách đây 2 tuần.',
    vitalSigns: {
      bloodPressure: '115/75 mmHg',
      heartRate: 88,
      respiratoryRate: 18,
      temperature: 37.9,
      spo2: 99,
    },
    physicalExamFindings: [
      'Bụng phẳng, di động theo nhịp thở, không sẹo mổ cũ.',
      'Ấn đau chói điểm McBurney ở hố chậu phải, có phản ứng thành bụng nhẹ (+).',
      'Dấu hiệu Blumberg (phản ứng dội) (+), dấu hiệu Rovsing (+), dấu cơ thắt lưng chậu (+).',
      'Khám phụ khoa: Cổ tử cung đóng kín, lắc cổ tử cung không đau, cùng đồ mềm không căng.'
    ],
    paraclinicalResults: [
      {
        name: 'Tổng phân tích tế bào máu ngoại vi',
        result: 'Bạch cầu (WBC): 13.800/uL, Bạch cầu đa nhân trung tính (NEU): 84%.',
        normalRange: 'WBC 4.000 - 10.000/uL',
        interpretation: 'Hội chứng đáp ứng viêm / nhiễm trùng cấp.',
      },
      {
        name: 'Xét nghiệm Beta-hCG nước tiểu',
        result: 'Âm tính (< 5 mIU/mL)',
        interpretation: 'Loại trừ thai ngoài tử cung vỡ.',
      },
      {
        name: 'Siêu âm Doppler màu ổ bụng',
        result: 'Hố chậu phải thấy cấu trúc hình ngón tay bịt một đầu, xuất phát từ manh tràng, không đè xẹp, đường kính ngoài d = 8.5 mm, thành dày 3mm, tưới máu tăng xung quanh.',
        normalRange: 'Đường kính ruột thừa bình thường < 6mm',
        interpretation: 'Hình ảnh điển hình của Viêm ruột thừa cấp tính chưa có biến chứng thủng.',
      }
    ],
    differentialDiagnoses: [
      'Nang buồng trứng xoắn hoặc vỡ nang hoàng thể',
      'Thai ngoài tử cung vỡ (đã loại trừ bằng beta-hCG)',
      'Viêm phần phụ cấp tính (PID)',
      'Viêm hạch mạc treo ruột (Mesenteric lymphadenitis)'
    ],
    definitiveDiagnosis: 'Viêm ruột thừa cấp giờ thứ 18 chưa có biến chứng thủng.',
    treatmentProtocol: [
      'Nhịn ăn uống hoàn toàn, lập đường truyền tĩnh mạch dung dịch Ringer Lactate.',
      'Kháng sinh dự phòng đường tĩnh mạch trước mổ bao phủ vi khuẩn Gr(-) và kỵ khí (Cephalosporin thế hệ 2/3 + Metronidazole).',
      'Phẫu thuật nội soi cắt ruột thừa viêm (Laparoscopic appendectomy) cấp cứu.'
    ],
    clinicalPearls: 'Ở phụ nữ trong độ tuổi sinh sản bị đau hố chậu phải, xét nghiệm Beta-hCG là BẮT BUỘC để loại trừ thai ngoài tử cung trước khi đưa ra bất kỳ quyết định ngoại khoa nào.'
  }
];
