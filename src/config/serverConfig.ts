/**
 * Cấu hình phía MÁY CHỦ (Vite config, Express, API handlers).
 *
 * Tệp này chỉ được import từ mã chạy trong Node, không bao giờ vào bundle
 * trình duyệt. `dotenv.config()` được gọi ngay tại đây — trước mọi lần đọc
 * biến — nên không phụ thuộc vào thứ tự nạp module ES.
 *
 * Thay cho các hằng số gắn cứng trước kia (`port: 3000`, `host: '0.0.0.0'`,
 * biến `DISABLE_HMR` riêng của AI Studio, User-Agent `aistudio-build`).
 */

import dotenv from 'dotenv';

dotenv.config();

type EnvMap = Record<string, string | undefined>;

const env: EnvMap = typeof process !== 'undefined' && process.env ? process.env : {};

function read(key: string, fallback: string): string {
  const raw = env[key];
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallback;
}

function readBoolean(key: string, fallback: boolean): boolean {
  const value = env[key]?.trim().toLowerCase();
  if (!value) return fallback;
  return value === 'true' || value === '1' || value === 'yes' || value === 'on';
}

function readNumber(key: string, fallback: number): number {
  const parsed = Number(env[key]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Mô hình phản hồi nhanh. */
export const FAST_MODEL = read('FAST_MODEL', 'gemini-3.8-flash');

/** Mô hình suy luận sâu. */
export const THINKING_MODEL = read('THINKING_MODEL', 'gemini-4-argon');

/** Mô hình chuyển giọng nói thành văn bản. */
export const TRANSCRIBE_MODEL = read('TRANSCRIBE_MODEL', 'gemini-3.5-transcribe');

/** Mô hình mặc định cho dịch vụ tương thích chuẩn OpenAI. */
export const DEFAULT_CUSTOM_LLM_MODEL = read('DEFAULT_CUSTOM_LLM_MODEL', 'gpt-4o');

/** User-Agent gửi kèm khi gọi Gemini API. */
export const GEMINI_USER_AGENT = read('GEMINI_USER_AGENT', 'AuraChat/1.0');

/** Cổng máy chủ (ưu tiên biến `PORT` mà PaaS/Cloud Run tự tiêm). */
export const SERVER_PORT = readNumber('PORT', 3000);

/** Địa chỉ lắng nghe của Vite dev server. */
export const SERVER_HOST = read('HOST', '0.0.0.0');

/** Bật/tắt Hot Module Replacement. */
export const HMR_ENABLED = readBoolean('VITE_HMR', !readBoolean('DISABLE_HMR', false));
