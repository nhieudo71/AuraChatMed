import { MedicalFlashcard } from '../types/medical';

export const MEDICAL_FLASHCARDS: MedicalFlashcard[] = [
  {
    id: 'fc_1',
    subject: 'Triệu chứng học Ngoại khoa',
    tag: 'signs',
    front: 'Tam chứng Charcot trong Viêm đường mật cấp do sỏi gồm những gì?',
    back: '1. Đau hạ sườn phải\n2. Sốt rét run\n3. Vàng da - Vàng mắt\n(Xuất hiện theo đúng trình tự thời gian: Đau -> Sốt -> Vàng da). Nếu kèm thêm Tụt huyết áp và Rối loạn tri giác thì trở thành Ngũ chứng Reynolds (sốc nhiễm trùng đường mật).',
    hint: 'Gồm 3 triệu chứng xuất hiện theo thứ tự thời gian đặc trưng.'
  },
  {
    id: 'fc_2',
    subject: 'Dược lý học Tim mạch',
    tag: 'pharmacology',
    front: 'Tại sao KHÔNG ĐƯỢC dùng thuốc chẹn Beta giao cảm đơn độc trong cơn tăng huyết áp do U tủy thượng thận (Pheochromocytoma)?',
    back: 'Vì nếu chỉ chẹn thụ thể Beta (gây giãn mạch), Epinephrine và Norepinephrine sẽ kích thích không đối kháng lên thụ thể Alpha-1 mạch máu, gây co mạch dữ dội dẫn đến cơn tăng huyết áp kịch phát đe dọa tính mạng! Quy tắc bắt buộc: Phải dùng thuốc chẹn Alpha trước (như Phenoxybenzamine), sau đó mới được phối hợp chẹn Beta.',
    hint: 'Hiện tượng kích thích Alpha không đối kháng (Unopposed alpha stimulation).'
  },
  {
    id: 'fc_3',
    subject: 'Điện tâm đồ (ECG)',
    tag: 'internal',
    front: 'Hình ảnh Điện tâm đồ đặc trưng của Tăng Kali máu (Hyperkalemia) theo mức độ tăng dần?',
    back: '1. Sóng T cao nhọn, đối xứng, đáy hẹp (dấu hiệu sớm nhất)\n2. Khoảng PR kéo dài, sóng P dẹt dần rồi biến mất\n3. Phức bộ QRS giãn rộng\n4. Sóng hình sin (Sine wave) - giai đoạn tiền ngừng tim\n5. Rung thất hoặc vô tâm thu.',
    hint: 'Bắt đầu từ sóng T cao nhọn và kết thúc bằng sóng hình sin.'
  },
  {
    id: 'fc_4',
    subject: 'Nhi khoa & Miễn dịch',
    tag: 'pediatrics',
    front: 'Tiêu chuẩn chẩn đoán Bệnh Kawasaki ở trẻ em?',
    back: 'Sốt cao liên tục >= 5 ngày kèm ít nhất 4 trong 5 tiêu chuẩn sau:\n1. Viêm kết mạc 2 mắt không xuất tiết\n2. Thay đổi ở môi miệng: môi đỏ nứt nẻ, lưỡi dâu tây (strawberry tongue)\n3. Thay đổi ở đầu chi: phù nề mu bàn tay chân, bong da đầu ngón\n4. Ban đỏ đa dạng trên da\n5. Hạch cổ sưng to (thường một bên, đường kính > 1.5 cm)\nĐiều trị chuẩn: IVIG (Globulin miễn dịch) + Aspirin liều cao để phòng phình động mạch vành.',
    hint: 'Sốt kéo dài >= 5 ngày + 4/5 tiêu chuẩn lâm sàng.'
  },
  {
    id: 'fc_5',
    subject: 'Kháng sinh & Vi sinh',
    tag: 'pharmacology',
    front: 'Thuốc kháng sinh nào được coi là "tiêu chuẩn vàng" để điều trị viêm ruột kết màng giả do Clostridioides difficile?',
    back: 'Vancomycin đường uống (Oral Vancomycin) 125mg x 4 lần/ngày hoặc Fidaxomicin đường uống. Lưu ý: Vancomycin đường tiêm tĩnh mạch KHÔNG bài tiết vào lòng ruột nên không có tác dụng điều trị C. difficile đường ruột!',
    hint: 'Vancomycin nhưng phải dùng theo đường nào?'
  },
  {
    id: 'fc_6',
    subject: 'Cấp cứu Tim mạch',
    tag: 'emergency',
    front: 'Trong ngừng tuần hoàn (Cardiac Arrest), 2 dạng nhịp tim nào có chỉ định Sốc điện (Shockable Rhythms)?',
    back: '1. Rung thất (Ventricular Fibrillation - VF)\n2. Nhịp nhanh thất vô mạch (Pulseless Ventricular Tachycardia - pVT)\nHai dạng nhịp KHÔNG sốc điện (Non-shockable): Vô tâm thu (Asystole) và Phân ly điện cơ (PEA).',
    hint: 'VF và Pulseless VT.'
  }
];
