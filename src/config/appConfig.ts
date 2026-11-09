/**
 * Cấu hình dùng chung ở phía TRÌNH DUYỆT (React/Vite).
 *
 * Các giá trị dưới đây trước kia bị gắn cứng (hard-code) theo môi trường
 * sandbox của Google AI Studio nên người dùng không thể thay đổi khi tách
 * dự án ra chạy độc lập. Nay chúng đọc từ biến môi trường có tiền tố `VITE_`,
 * với giá trị mặc định giữ nguyên hành vi cũ.
 *
 * Không đặt `process.env` hay `dotenv` ở đây: tệp này được đóng gói vào bundle
 * trình duyệt. Cấu hình phía máy chủ nằm ở `src/config/serverConfig.ts`.
 */

type EnvMap = Record<string, string | undefined>;

const env: EnvMap =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? ((import.meta as any).env as EnvMap)
    : {};

function read(key: string, fallback: string): string {
  const raw = env[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallback;
}

/** Mô hình phản hồi nhanh, dùng cho chế độ thường và Siêu tốc. */
export const FAST_MODEL = read('VITE_FAST_MODEL', 'gemini-3.8-flash');

/** Mô hình suy luận sâu, dùng khi bật chế độ tư duy logic. */
export const THINKING_MODEL = read('VITE_THINKING_MODEL', 'gemini-4-argon');

/** Mô hình chuyển giọng nói thành văn bản. */
export const TRANSCRIBE_MODEL = read('VITE_TRANSCRIBE_MODEL', 'gemini-3.5-transcribe');

/** Mô hình mặc định cho giọng đọc / TTS nếu chưa cấu hình riêng. */
export const DEFAULT_TTS_MODEL = read('VITE_DEFAULT_TTS_MODEL', 'eleven_multilingual_v2');

/** Mô hình mặc định của các dịch vụ tương thích chuẩn OpenAI. */
export const DEFAULT_CUSTOM_LLM_MODEL = read('VITE_DEFAULT_CUSTOM_LLM_MODEL', 'gpt-4o');

/** User-Agent gửi kèm khi gọi Gemini API. */
export const GEMINI_USER_AGENT = read('VITE_GEMINI_USER_AGENT', 'AuraChat/1.0');

/** URL công khai của ứng dụng (OAuth callback, liên kết tự tham chiếu...). */
export const APP_URL = read('VITE_APP_URL', 'http://localhost:3000');
