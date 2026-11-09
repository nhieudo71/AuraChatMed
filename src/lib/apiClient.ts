/**
 * Lớp gọi API dùng chung cho các endpoint nội bộ `/api/*`.
 *
 * Vì sao cần: `fetch` ném `TypeError: Failed to fetch` cho MỌI sự cố mạng —
 * máy chủ chưa chạy, sai cổng, mất mạng, service worker chặn request, hoặc
 * trang đang mở bằng `file://`. Thông báo thô đó không cho biết phải sửa gì.
 * Hàm này giữ nguyên dữ liệu phản hồi nhưng đổi lỗi mạng thành câu tiếng Việt
 * nêu đúng khả năng cần kiểm tra.
 */

export interface ApiResponseLike {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function describeNetworkFailure(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return (
      'Trang đang mở trực tiếp từ tệp (file://) nên không gọi được máy chủ API. ' +
      'Hãy chạy run.bat rồi mở http://localhost:6768.'
    );
  }

  return (
    'Không kết nối được tới máy chủ nội bộ (/api). Kiểm tra: ' +
    '(1) máy chủ đã chạy chưa — cửa sổ run.bat phải đang mở; ' +
    '(2) địa chỉ có đúng cổng 6768 không; ' +
    '(3) nếu vừa đổi cấu hình, hãy tải lại trang bằng Ctrl+Shift+R.'
  );
}

/**
 * POST JSON tới endpoint nội bộ, trả về `{ ok, status, text }`.
 * Không tự parse JSON để nơi gọi giữ được logic kiểm tra HTML/JSON riêng.
 */
export async function requestApi(
  path: string,
  body: unknown,
  options: { timeoutMs?: number } = {}
): Promise<ApiResponseLike> {
  const timeoutMs = options.timeoutMs ?? 60000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      text: () => response.text(),
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new ApiError(
        `Máy chủ không phản hồi sau ${Math.round(timeoutMs / 1000)} giây. Thử lại hoặc kiểm tra kết nối mạng.`,
        0
      );
    }
    throw new ApiError(describeNetworkFailure(), 0);
  } finally {
    clearTimeout(timer);
  }
}
