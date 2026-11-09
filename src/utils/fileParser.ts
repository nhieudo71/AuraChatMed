import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { ChatAttachment } from '../types';

/**
 * Convert a File object to base64 string (without the data:mime;base64, prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Read text file content
 */
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string) || '');
    reader.onerror = (err) => reject(err);
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Parse Excel file (.xlsx, .xls, .csv) into structured markdown table representation
 */
export async function parseExcelFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sections: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    // Convert sheet to CSV text
    const csvData = XLSX.utils.sheet_to_csv(sheet);
    if (csvData && csvData.trim()) {
      sections.push(`--- Bảng tính Sheet: "${sheetName}" ---\n${csvData.trim()}`);
    }
  }

  return sections.length > 0
    ? sections.join('\n\n')
    : 'Bảng tính Excel rỗng hoặc không có dữ liệu.';
}

/**
 * Parse Word file (.docx) into raw text
 */
export async function parseWordFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const text = result.value.trim();
  return text || 'Tài liệu Word rỗng hoặc không có văn bản.';
}

/**
 * Parse PowerPoint file (.pptx) by extracting slide text from XML files inside ZIP
 */
export async function parsePptxFile(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const slideEntries = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(name)
    );

    // Sort slides numerically: slide1, slide2, ...
    slideEntries.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    if (slideEntries.length === 0) {
      return 'Tài liệu PowerPoint không có trang slide hoặc định dạng cũ.';
    }

    const slideTexts: string[] = [];
    for (let i = 0; i < slideEntries.length; i++) {
      const xmlName = slideEntries[i];
      const xmlContent = await zip.files[xmlName].async('text');
      // Strip XML tags (<...>) and decode special entities
      const cleanText = xmlContent
        .replace(/<a:p.*?>/g, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText) {
        slideTexts.push(`--- Slide ${i + 1} ---\n${cleanText}`);
      }
    }

    return slideTexts.length > 0
      ? slideTexts.join('\n\n')
      : 'Không tìm thấy nội dung văn bản trong các slide PowerPoint.';
  } catch (err: any) {
    console.error('Error parsing PPTX:', err);
    return `Lỗi đọc slide PowerPoint: ${err.message || 'Không thể giải nén tệp pptx'}`;
  }
}

/**
 * Format bytes into human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Process any uploaded file into a ChatAttachment
 */
export async function processUploadedFile(file: File): Promise<ChatAttachment> {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const size = file.size;
  const id = 'att_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

  // 1. Image
  if (file.type.startsWith('image/')) {
    const base64 = await fileToBase64(file);
    return {
      id,
      name: file.name,
      type: 'image',
      mimeType: file.type || 'image/jpeg',
      size,
      url: URL.createObjectURL(file),
      base64,
    };
  }

  // 2. Video
  if (file.type.startsWith('video/')) {
    const base64 = await fileToBase64(file);
    return {
      id,
      name: file.name,
      type: 'video',
      mimeType: file.type || 'video/mp4',
      size,
      url: URL.createObjectURL(file),
      base64,
    };
  }

  // 3. PDF
  if (file.type === 'application/pdf' || extension === 'pdf') {
    const base64 = await fileToBase64(file);
    return {
      id,
      name: file.name,
      type: 'pdf',
      mimeType: 'application/pdf',
      size,
      base64,
    };
  }

  // 4. Excel (.xlsx, .xls, .csv)
  if (extension === 'xlsx' || extension === 'xls' || extension === 'csv' || file.type.includes('spreadsheet') || file.type.includes('excel')) {
    const extractedText = await parseExcelFile(file);
    return {
      id,
      name: file.name,
      type: 'xlsx',
      mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size,
      extractedText,
    };
  }

  // 5. Word (.docx, .doc)
  if (extension === 'docx' || extension === 'doc' || file.type.includes('wordprocessingml') || file.type.includes('msword')) {
    let extractedText = '';
    try {
      extractedText = await parseWordFile(file);
    } catch (e: any) {
      extractedText = `(Không thể trích xuất toàn bộ văn bản docx: ${e.message})`;
    }
    return {
      id,
      name: file.name,
      type: 'docx',
      mimeType: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size,
      extractedText,
    };
  }

  // 6. PowerPoint (.pptx, .ppt)
  if (extension === 'pptx' || extension === 'ppt' || file.type.includes('presentationml') || file.type.includes('powerpoint')) {
    let extractedText = '';
    try {
      extractedText = await parsePptxFile(file);
    } catch (e: any) {
      extractedText = `(Không thể trích xuất slide PowerPoint: ${e.message})`;
    }
    return {
      id,
      name: file.name,
      type: 'pptx',
      mimeType: file.type || 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      size,
      extractedText,
    };
  }

  // 7. Plain Text / Markdown / Code
  const textContent = await readTextFile(file);
  return {
    id,
    name: file.name,
    type: extension === 'md' ? 'text' : 'text',
    mimeType: file.type || 'text/plain',
    size,
    extractedText: textContent,
  };
}
