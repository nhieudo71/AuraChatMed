import { CalculatorScoreResult } from '../types/medical';

/**
 * 1. Glasgow Coma Scale (GCS) - Đánh giá tri giác
 * Eye: 1-4, Verbal: 1-5, Motor: 1-6
 */
export function calculateGCS(eye: number, verbal: number, motor: number): CalculatorScoreResult {
  const safeEye = Math.min(Math.max(eye, 1), 4);
  const safeVerbal = Math.min(Math.max(verbal, 1), 5);
  const safeMotor = Math.min(Math.max(motor, 1), 6);
  const score = safeEye + safeVerbal + safeMotor;

  let riskLevel: CalculatorScoreResult['riskLevel'] = 'Bình thường';
  let interpretation = '';
  let recommendation = '';

  if (score >= 13) {
    riskLevel = 'Thấp';
    interpretation = 'Chấn thương sọ não / Rối loạn ý thức mức độ NHẸ (GCS 13 - 15).';
    recommendation = 'Theo dõi sát tri giác mỗi 1 - 2 giờ, chụp CT sọ não nếu có dấu hiệu cảnh báo (nôn ói nhiều, co giật, đau đầu tăng).';
  } else if (score >= 9) {
    riskLevel = 'Trung bình';
    interpretation = 'Chấn thương sọ não / Rối loạn ý thức mức độ TRUNG BÌNH (GCS 9 - 12).';
    recommendation = 'Chỉ định chụp CT sọ não cấp cứu, nhập khoa Hồi sức cấp cứu / Phẫu thuật thần kinh, theo dõi sát đường thở.';
  } else {
    riskLevel = 'Rất cao';
    interpretation = 'Chấn thương sọ não mức độ NẶNG / HÔN MÊ SÂU (GCS 3 - 8).';
    recommendation = 'Cấp cứu tối khẩn: Xem xét chỉ định đặt nội khí quản bảo vệ đường thở khẩn cấp (GCS ≤ 8), hội chẩn Hồi sức & Phẫu thuật thần kinh.';
  }

  return { score, riskLevel, interpretation, recommendation };
}

/**
 * 2. CURB-65 - Phân tầng mức độ nặng của Viêm phổi mắc phải cộng đồng (CAP)
 */
export function calculateCURB65(
  confusion: boolean,
  ureaHigh: boolean,       // Urea > 7 mmol/L (BUN > 19 mg/dL)
  respRateHigh: boolean,   // Nhịp thở >= 30 lần/phút
  bpLow: boolean,          // Huyết áp tâm thu < 90 hoặc tâm trương <= 60 mmHg
  age65Plus: boolean       // Tuổi >= 65
): CalculatorScoreResult {
  let score = 0;
  if (confusion) score += 1;
  if (ureaHigh) score += 1;
  if (respRateHigh) score += 1;
  if (bpLow) score += 1;
  if (age65Plus) score += 1;

  let riskLevel: CalculatorScoreResult['riskLevel'] = 'Thấp';
  let interpretation = '';
  let recommendation = '';

  if (score === 0 || score === 1) {
    riskLevel = 'Thấp';
    interpretation = `Điểm CURB-65: ${score} điểm. Tỷ lệ tử vong thấp (< 2%).`;
    recommendation = 'Có thể xem xét điều trị ngoại trú với kháng sinh đường uống thích hợp, tái khám sau 48-72 giờ.';
  } else if (score === 2) {
    riskLevel = 'Trung bình';
    interpretation = `Điểm CURB-65: 2 điểm. Tỷ lệ tử vong trung bình (~9%).`;
    recommendation = 'Chỉ định nhập viện điều trị nội trú tại khoa Nội Hô hấp, theo dõi sát đáp ứng điều trị.';
  } else {
    riskLevel = 'Rất cao';
    interpretation = `Điểm CURB-65: ${score} điểm. Viêm phổi NẶNG (Tỷ lệ tử vong 15 - 40%).`;
    recommendation = 'Chỉ định nhập viện điều trị tích cực, đánh giá tiêu chuẩn nhập khoa Hồi sức tích cực (ICU). Kháng sinh tĩnh mạch phối hợp phổ rộng.';
  }

  return { score, riskLevel, interpretation, recommendation };
}

/**
 * 3. Thang điểm Alvarado - Đánh giá khả năng Viêm ruột thừa cấp
 */
export function calculateAlvarado(params: {
  migratoryPain: boolean;   // Đau di chuyển từ thượng vị/quanh rốn xuống hố chậu phải (1)
  anorexia: boolean;        // Chán ăn (1)
  nauseaVomiting: boolean;  // Buồn nôn hoặc nôn (1)
  rlqTenderness: boolean;   // Đau/ấn đau vùng hố chậu phải (2)
  reboundTenderness: boolean; // Dấu hiệu phản ứng dội (Blumberg) (+) (1)
  fever: boolean;           // Sốt >= 37.3°C (1)
  leukocytosis: boolean;    // Bạch cầu tăng > 10,000/uL (2)
  neutrophilShift: boolean; // Chuyển trái bạch cầu đa nhân trung tính > 75% (1)
}): CalculatorScoreResult {
  let score = 0;
  if (params.migratoryPain) score += 1;
  if (params.anorexia) score += 1;
  if (params.nauseaVomiting) score += 1;
  if (params.rlqTenderness) score += 2;
  if (params.reboundTenderness) score += 1;
  if (params.fever) score += 1;
  if (params.leukocytosis) score += 2;
  if (params.neutrophilShift) score += 1;

  let riskLevel: CalculatorScoreResult['riskLevel'] = 'Thấp';
  let interpretation = '';
  let recommendation = '';

  if (score <= 4) {
    riskLevel = 'Thấp';
    interpretation = `Điểm Alvarado: ${score}/10 điểm. Ít nghĩ tới viêm ruột thừa cấp.`;
    recommendation = 'Tìm các nguyên nhân gây đau bụng khác, có thể theo dõi ngoại trú nếu triệu chứng thuyên giảm và hẹn tái khám.';
  } else if (score <= 6) {
    riskLevel = 'Trung bình';
    interpretation = `Điểm Alvarado: ${score}/10 điểm. Nghi ngờ viêm ruột thừa cấp.`;
    recommendation = 'Lưu viện theo dõi sát tại khoa Ngoại tổng quát, siêu âm ổ bụng hoặc chụp CT scan ổ bụng cản quang.';
  } else {
    riskLevel = 'Rất cao';
    interpretation = `Điểm Alvarado: ${score}/10 điểm. Rất có khả năng cao là viêm ruột thừa cấp (> 90%).`;
    recommendation = 'Hội chẩn phẫu thuật viên ngoại khoa khẩn, chuẩn bị bệnh nhân cho phẫu thuật nội soi cắt ruột thừa.';
  }

  return { score, riskLevel, interpretation, recommendation };
}

/**
 * 4. CHA2DS2-VASc - Đánh giá nguy cơ đột quỵ ở bệnh nhân Rung nhĩ không do bệnh van tim
 */
export function calculateCHA2DS2VASc(params: {
  age: number;
  gender: 'male' | 'female';
  heartFailure: boolean;    // Suy tim sung huyết hoặc LVEF <= 40% (1)
  hypertension: boolean;    // Tăng huyết áp (1)
  strokeTIAThrombo: boolean; // Tiền sử đột quỵ / TIA / Thuyên tắc huyết khối (2)
  vascularDisease: boolean; // Bệnh mạch máu (Tiền sử NMCT, bệnh ĐM ngoại biên, mảng xơ vữa ĐMC) (1)
  diabetes: boolean;        // Đái tháo đường (1)
}): CalculatorScoreResult {
  let score = 0;
  if (params.heartFailure) score += 1;
  if (params.hypertension) score += 1;
  if (params.diabetes) score += 1;
  if (params.strokeTIAThrombo) score += 2;
  if (params.vascularDisease) score += 1;

  if (params.age >= 75) {
    score += 2;
  } else if (params.age >= 65) {
    score += 1;
  }

  if (params.gender === 'female') {
    score += 1;
  }

  const isMale = params.gender === 'male';
  let riskLevel: CalculatorScoreResult['riskLevel'] = 'Thấp';
  let interpretation = '';
  let recommendation = '';

  if ((isMale && score === 0) || (!isMale && score === 1)) {
    riskLevel = 'Thấp';
    interpretation = `Điểm CHA2DS2-VASc: ${score} điểm. Nguy cơ đột quỵ rất thấp (~0%/năm).`;
    recommendation = 'Không khuyến cáo dùng thuốc chống đông máu hoặc kháng kết tập tiểu cầu (Theo ESC 2024 / AHA).';
  } else if (isMale && score === 1) {
    riskLevel = 'Trung bình';
    interpretation = `Điểm CHA2DS2-VASc: 1 điểm ở Nam giới. Nguy cơ đột quỵ trung bình (~1.3%/năm).`;
    recommendation = 'Cân nhắc dùng thuốc kháng đông đường uống (NOAC/DOAC ưu tiên hơn VKA) dựa trên đánh giá cá thể hóa nguy cơ xuất huyết (HAS-BLED).';
  } else {
    riskLevel = 'Cao';
    interpretation = `Điểm CHA2DS2-VASc: ${score} điểm. Nguy cơ đột quỵ cao (≥ 2.2% - 15%/năm).`;
    recommendation = 'Khuyến cáo mạnh mẽ chỉ định thuốc kháng đông đường uống (NOAC: Apixaban, Rivaroxaban, Dabigatran, Edoxaban hoặc VKA), trừ khi có chống chỉ định tuyệt đối.';
  }

  return { score, riskLevel, interpretation, recommendation };
}

/**
 * 5. Quick SOFA (qSOFA) - Sàng lọc nhanh nguy cơ nhiễm khuẩn huyết (Sepsis) ngoài ICU
 */
export function calculateQSOFA(
  respRateGe22: boolean,      // Nhịp thở >= 22 lần/phút (1)
  alteredMentation: boolean,  // Thay đổi ý thức (GCS < 15) (1)
  sbpLe100: boolean           // Huyết áp tâm thu <= 100 mmHg (1)
): CalculatorScoreResult {
  let score = 0;
  if (respRateGe22) score += 1;
  if (alteredMentation) score += 1;
  if (sbpLe100) score += 1;

  let riskLevel: CalculatorScoreResult['riskLevel'] = 'Thấp';
  let interpretation = '';
  let recommendation = '';

  if (score < 2) {
    riskLevel = 'Thấp';
    interpretation = `Điểm qSOFA: ${score}/3 điểm. Nguy cơ nhiễm khuẩn huyết nặng chưa cao tại thời điểm đánh giá.`;
    recommendation = 'Tiếp tục theo dõi các dấu hiệu sinh tồn, tìm ổ nhiễm trùng và đánh giá lại nếu tình trạng lâm sàng thay đổi.';
  } else {
    riskLevel = 'Rất cao';
    interpretation = `Điểm qSOFA: ${score}/3 điểm (DƯƠNG TÍNH qSOFA ≥ 2). Nguy cơ tử vong hoặc nằm ICU tăng gấp 3-14 lần!`;
    recommendation = 'Cảnh báo Sepsis khẩn cấp: Đánh giá điểm SOFA đầy đủ, cấy máu, đo Lactate máu, hồi sức dịch tĩnh mạch và dùng kháng sinh phổ rộng trong vòng 1 giờ đầu (Sepsis-3 guidelines).';
  }

  return { score, riskLevel, interpretation, recommendation };
}
