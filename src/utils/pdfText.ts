/**
 * Trích xuất văn bản từ PDF ngay trên trình duyệt, dùng Mozilla PDF.js.
 *
 * Vì sao dùng PDF.js: bộ trích tự viết trước đây chỉ đọc các khối
 * `stream ... endstream` rồi rút chuỗi trong ngoặc. Cách đó đúng với PDF dùng
 * font đơn giản (WinAnsi/FaceName), nhưng thất bại với PDF dùng font nhúng
 * dạng CID/Type0 — loại phổ biến khi xuất từ Word, LaTeX hoặc các trình tạo
 * PDF tiếng Việt. Với font CID, byte trong file không phải ký tự; phải tra
 * bảng `ToUnicode` CMap mới ra được chữ thật. PDF.js có sẵn máy CMap và hơn
 * 200 bảng mã (`cmaps/`) nên xử lý đúng các trường hợp này.
 *
 * Toàn bộ xử lý diễn ra trong trình duyệt; tệp không rời khỏi máy người dùng.
 */

import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

/**
 * Trỏ worker tới bản do chính pdfjs-dist cung cấp. Vite gói tệp này thành một
 * asset riêng, nhờ đó không phải tải worker từ CDN (hoạt động cả khi offline).
 */
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * URL gốc của thư mục tài nguyên (cmaps, standard_fonts).
 * Thiếu `cMapUrl` thì PDF.js trả về chuỗi rỗng cho mọi PDF dùng font CJK/CID —
 * đúng kiểu lỗi "không trích được chữ" mà hàm này cần khắc phục.
 * Vite copy các thư mục này sang `dist/` nhờ `publicDir` trong vite.config.ts.
 */
const CMAP_URL = '/pdfjs/cmaps/';
const STANDARD_FONT_URL = '/pdfjs/standard_fonts/';

export interface PdfTextResult {
  text: string;
  ok: boolean;
  reason?: string;
  /** Số trang và số trang có chữ, dùng để cảnh báo khi tài liệu là bản scan. */
  totalPages?: number;
  pagesWithText?: number;
}

/** Chuỗi lỗi người dùng đọc được, thay vì thông báo nội bộ của PDF.js. */
function humanizeError(err: any): string {
  const name = String(err?.name || '');
  const message = String(err?.message || err || '');

  if (name === 'PasswordException') {
    return 'Tệp PDF được bảo vệ bằng mật khẩu. Hãy mở khóa (bỏ mật khẩu) rồi tải lại.';
  }
  if (name === 'InvalidPDFException' || message.includes('Invalid PDF')) {
    return 'Tệp không phải PDF hợp lệ hoặc đã bị hỏng khi tải xuống.';
  }
  if (message.includes('MissingPDF')) {
    return 'Không tìm thấy tệp PDF. Hãy chọn lại tệp.';
  }
  return `Không đọc được PDF: ${message || 'lỗi không xác định'}`;
}

/**
 * Dọn văn bản: gộp khoảng trắng thừa nhưng giữ xuống dòng giữa các khối,
 * vì câu hỏi trắc nghiệm cần ranh giới đoạn để đối chiếu trích dẫn.
 */
function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface ExtractPdfOptions {
  /** Trang bắt đầu (1-based). Mặc định 1. */
  startPage?: number;
  /** Trang kết thúc (1-based, bao gồm). Mặc định trang cuối. */
  endPage?: number;
  /** Giới hạn số trang xử lý để tránh treo tab với PDF hàng nghìn trang. */
  maxPages?: number;
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Trích văn bản từ File PDF.
 * `ok: false` nghĩa là PDF không có lớp văn bản dùng được (thường là bản scan ảnh).
 */
export async function extractPdfText(
  file: File,
  options: ExtractPdfOptions = {}
): Promise<PdfTextResult> {
  const maxPages = options.maxPages ?? 500;

  try {
    const buffer = await file.arrayBuffer();

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      cMapUrl: CMAP_URL,
      cMapPacked: true,
      standardFontDataUrl: STANDARD_FONT_URL,
      // Cho phép dùng font hệ thống khi PDF tham chiếu font không nhúng.
      useSystemFonts: true,
    });

    const doc = await loadingTask.promise;
    const totalPages = doc.numPages;

    const startPage = Math.max(1, options.startPage ?? 1);
    const lastPage = Math.min(options.endPage ?? totalPages, totalPages);
    const pageLimit = Math.min(lastPage, startPage + maxPages - 1);

    const pageTexts: string[] = [];
    let pagesWithText = 0;

    for (let pageNumber = startPage; pageNumber <= pageLimit; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const content = await page.getTextContent();

      let lastY: number | null = null;
      const lines: string[] = [];

      for (const item of content.items as (TextItem | TextMarkedContent)[]) {
        if (!('str' in item)) continue;
        const textItem = item as TextItem;
        if (!textItem.str) continue;

        // `hasEOL` báo điểm kết thúc dòng do PDF.js phát hiện từ ma trận văn bản.
        // Nếu không có, so sánh toạ độ Y để tự nhận biết xuống dòng.
        const y = textItem.transform?.[5] ?? null;
        const isNewLine = textItem.hasEOL || (lastY !== null && y !== null && Math.abs(y - lastY) > 2);

        if (isNewLine && lines.length > 0) {
          lines[lines.length - 1] = lines[lines.length - 1].trimEnd();
          lines.push(textItem.str);
        } else if (lines.length === 0) {
          lines.push(textItem.str);
        } else {
          const previous = lines[lines.length - 1];
          // Nối bằng khoảng trắng, trừ khi lần trước đã có sẵn dấu cách.
          lines[lines.length - 1] = /\s$/.test(previous) ? previous + textItem.str : `${previous} ${textItem.str}`;
        }

        lastY = y;
      }

      const pageText = normalizeText(lines.join('\n'));
      if (pageText) {
        pagesWithText++;
        pageTexts.push(pageText);
      }

      page.cleanup();
      options.onProgress?.(pageNumber - startPage + 1, pageLimit - startPage + 1);
    }

    // Giải phóng tài nguyên qua loadingTask (API công khai của pdfjs-dist 6.x;
    // PDFDocumentProxy không còn expose destroy()).
    await loadingTask.destroy();

    const text = normalizeText(pageTexts.join('\n\n'));

    if (!text) {
      return {
        text: '',
        ok: false,
        totalPages,
        pagesWithText: 0,
        reason:
          `Đã đọc ${totalPages} trang nhưng không có trang nào chứa lớp văn bản. ` +
          'Tệp gần như chắc chắn là bản scan/ảnh chụp. Cần OCR trước — hoặc tải lên bản PDF có thể bôi đen chữ, hay chuyển sang Word (.docx) / văn bản (.txt).',
      };
    }

    // PDF nhiều trang scan lẫn trang chữ: báo rõ để người dùng biết đã đọc một phần.
    if (pagesWithText < totalPages) {
      return {
        text,
        ok: true,
        totalPages,
        pagesWithText,
        reason:
          `Chỉ ${pagesWithText}/${totalPages} trang có lớp văn bản; phần còn lại có thể là ảnh scan và đã bị bỏ qua. ` +
          'Câu hỏi chỉ được sinh từ phần chữ đọc được.',
      };
    }

    return { text, ok: true, totalPages, pagesWithText };
  } catch (err: any) {
    return { text: '', ok: false, reason: humanizeError(err) };
  }
}

/**
 * Kiểm tra nhanh một tệp có phải PDF không.
 * Dùng để chặn người dùng tải nhầm tệp trước khi xử lý.
 */
export function looksLikePdf(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}
