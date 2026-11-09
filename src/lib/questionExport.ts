import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { MedicalQuestion, QuestionLibraryItem } from '../types/medical';
import { getQuestionTypeLabel, SPECIALTY_LABELS, EXAM_CATEGORY_LABELS, DIFFICULTY_LABELS } from '../data/questionTypes';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(title: string): string {
  return (
    title
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) || 'bo-cau-hoi'
  );
}

const LETTERS = 'ABCDEFGH';

/** Dựng nội dung Markdown của một bộ câu hỏi (kèm đáp án và giải thích). */
export function buildQuestionsMarkdown(item: QuestionLibraryItem, includeAnswers = true): string {
  const lines: string[] = [];

  lines.push(`# ${item.title}`);
  lines.push('');
  lines.push(`- **Môn học:** ${item.subject || 'Chưa phân loại'}`);
  lines.push(`- **Chuyên khoa:** ${SPECIALTY_LABELS[item.specialty] || item.specialty}`);
  lines.push(`- **Mục tiêu kỳ thi:** ${EXAM_CATEGORY_LABELS[item.examCategory] || item.examCategory}`);
  lines.push(`- **Độ khó:** ${DIFFICULTY_LABELS[item.difficulty] || item.difficulty}`);
  lines.push(`- **Số câu:** ${item.questions.length}`);
  if (item.sourceNames.length) {
    lines.push(`- **Tài liệu nguồn:** ${item.sourceNames.join('; ')}`);
  }
  lines.push(`- **Cập nhật:** ${new Date(item.updatedAt).toLocaleString('vi-VN')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  item.questions.forEach((q, idx) => {
    lines.push(`## Câu ${idx + 1}`);
    lines.push('');
    lines.push(`*Kiểu câu hỏi: ${getQuestionTypeLabel(q.questionType)}*`);
    lines.push('');

    if (q.vignette) {
      lines.push(`> ${q.vignette}`);
      lines.push('');
    }

    lines.push(q.question);
    lines.push('');

    q.options.forEach((opt, optIdx) => {
      lines.push(`- **${LETTERS[optIdx] || optIdx + 1}.** ${opt}`);
    });
    lines.push('');

    if (includeAnswers) {
      const correct = LETTERS[q.correctIndex] || String(q.correctIndex + 1);
      lines.push(`**Đáp án đúng: ${correct}.** ${q.options[q.correctIndex] ?? ''}`);
      lines.push('');
      lines.push(`**Giải thích:** ${q.explanation}`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

/** Xuất Markdown. */
export function exportQuestionsToMarkdown(item: QuestionLibraryItem, includeAnswers = true) {
  const content = buildQuestionsMarkdown(item, includeAnswers);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${safeFileName(item.title)}.md`);
}

/** Xuất Word (.docx). */
export async function exportQuestionsToDocx(item: QuestionLibraryItem, includeAnswers = true) {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      text: item.title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    })
  );

  const meta = [
    `Môn học: ${item.subject || 'Chưa phân loại'}`,
    `Chuyên khoa: ${SPECIALTY_LABELS[item.specialty] || item.specialty}`,
    `Mục tiêu: ${EXAM_CATEGORY_LABELS[item.examCategory] || item.examCategory}`,
    `Độ khó: ${DIFFICULTY_LABELS[item.difficulty] || item.difficulty}`,
    `Số câu: ${item.questions.length}`,
  ];
  if (item.sourceNames.length) meta.push(`Tài liệu nguồn: ${item.sourceNames.join('; ')}`);

  meta.forEach((line) => children.push(new Paragraph({ text: line, spacing: { after: 80 } })));
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  item.questions.forEach((q, idx) => {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Câu ${idx + 1}`, bold: true, size: 26 })],
        spacing: { before: 300, after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Kiểu câu hỏi: ${getQuestionTypeLabel(q.questionType)}`, italics: true, size: 18, color: '666666' }),
        ],
        spacing: { after: 100 },
      })
    );

    if (q.vignette) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: q.vignette, italics: true })],
          spacing: { after: 120 },
          indent: { left: 360 },
        })
      );
    }

    children.push(
      new Paragraph({
        children: [new TextRun({ text: q.question, bold: true })],
        spacing: { after: 120 },
      })
    );

    q.options.forEach((opt, optIdx) => {
      children.push(
        new Paragraph({
          text: `${LETTERS[optIdx] || optIdx + 1}. ${opt}`,
          spacing: { after: 60 },
          indent: { left: 360 },
        })
      );
    });

    if (includeAnswers) {
      const correct = LETTERS[q.correctIndex] || String(q.correctIndex + 1);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Đáp án: ${correct}. `, bold: true, color: '047857' }),
            new TextRun({ text: q.options[q.correctIndex] ?? '' }),
          ],
          spacing: { before: 160, after: 80 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Giải thích: ', bold: true }),
            new TextRun({ text: q.explanation }),
          ],
          spacing: { after: 200 },
        })
      );
    }
  });

  const doc = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${safeFileName(item.title)}.docx`);
}

/**
 * Xuất PDF.
 *
 * jsPDF với font mặc định (helvetica) KHÔNG hỗ trợ dấu tiếng Việt — chữ sẽ bị
 * mất dấu hoặc thành ký tự lạ. Để tránh phải nhúng file font .ttf, nội dung
 * được vẽ lên canvas bằng font hệ thống rồi đưa vào PDF dưới dạng ảnh.
 * Cách này giữ nguyên dấu và hiển thị đúng trên mọi máy.
 */
export async function exportQuestionsToPdf(item: QuestionLibraryItem, includeAnswers = true) {
  const A4 = { widthMm: 210, heightMm: 297 };
  const marginMm = 15;
  const scale = 2; // Raster 2x cho nét chữ rõ khi in

  const mmToPx = (mm: number) => (mm / 25.4) * 96 * scale;
  const widthPx = mmToPx(A4.widthMm - marginMm * 2);
  const heightPx = mmToPx(A4.heightMm - marginMm * 2);

  const bodyFont = '15px "Segoe UI", "Helvetica Neue", Arial, sans-serif';
  const titleFont = 'bold 21px "Segoe UI", "Helvetica Neue", Arial, sans-serif';

  // 1. Dàn nội dung thành các khối dòng có kiểu chữ riêng.
  type Block = { text: string; font: string; color: string; gapAfter: number; indent: number };
  const blocks: Block[] = [];

  const pushBlock = (text: string, opts: Partial<Block> = {}) =>
    blocks.push({
      text,
      font: bodyFont,
      color: '#1c1917',
      gapAfter: 6,
      indent: 0,
      ...opts,
    });

  pushBlock(item.title, { font: titleFont, gapAfter: 14 });
  pushBlock(`Môn học: ${item.subject || 'Chưa phân loại'}`, { color: '#57534e' });
  pushBlock(`Chuyên khoa: ${SPECIALTY_LABELS[item.specialty] || item.specialty}`, { color: '#57534e' });
  pushBlock(`Mục tiêu: ${EXAM_CATEGORY_LABELS[item.examCategory] || item.examCategory}`, { color: '#57534e' });
  pushBlock(`Độ khó: ${DIFFICULTY_LABELS[item.difficulty] || item.difficulty}`, { color: '#57534e' });
  pushBlock(`Số câu: ${item.questions.length}`, { color: '#57534e' });
  if (item.sourceNames.length) {
    pushBlock(`Tài liệu nguồn: ${item.sourceNames.join('; ')}`, { color: '#57534e' });
  }
  pushBlock('', { gapAfter: 10 });

  item.questions.forEach((q, idx) => {
    pushBlock(`Câu ${idx + 1}`, { font: 'bold 17px "Segoe UI", Arial, sans-serif', gapAfter: 4 });
    pushBlock(`Kiểu câu hỏi: ${getQuestionTypeLabel(q.questionType)}`, {
      font: 'italic 13px "Segoe UI", Arial, sans-serif',
      color: '#78716c',
      gapAfter: 8,
    });

    if (q.vignette) {
      pushBlock(q.vignette, { font: 'italic 14px "Segoe UI", Arial, sans-serif', color: '#44403c', indent: 12, gapAfter: 8 });
    }

    pushBlock(q.question, { font: 'bold 15px "Segoe UI", Arial, sans-serif', gapAfter: 8 });

    q.options.forEach((opt, optIdx) => {
      pushBlock(`${LETTERS[optIdx] || optIdx + 1}. ${opt}`, { indent: 14, gapAfter: 4 });
    });

    if (includeAnswers) {
      const correct = LETTERS[q.correctIndex] || String(q.correctIndex + 1);
      pushBlock(`Đáp án: ${correct}. ${q.options[q.correctIndex] ?? ''}`, {
        font: 'bold 15px "Segoe UI", Arial, sans-serif',
        color: '#047857',
        gapAfter: 6,
      });
      pushBlock(`Giải thích: ${q.explanation}`, { gapAfter: 8 });
    }

    pushBlock('', { gapAfter: 8 });
  });

  // 2. Đo và ngắt dòng trên canvas ẩn.
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('Trình duyệt không hỗ trợ canvas để xuất PDF.');

  type Line = { text: string; font: string; color: string; indent: number; height: number };
  const lines: Line[] = [];

  for (const block of blocks) {
    measureCtx.font = block.font;
    const lineHeight = parseInt(block.font.match(/(\d+)px/)?.[1] || '15', 10) * 1.6;

    if (!block.text) {
      lines.push({ text: '', font: block.font, color: block.color, indent: 0, height: block.gapAfter + 6 });
      continue;
    }

    const available = widthPx - block.indent;
    const words = block.text.split(/\s+/);
    let current = '';

    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (measureCtx.measureText(test).width > available && current) {
        lines.push({ text: current, font: block.font, color: block.color, indent: block.indent, height: lineHeight });
        current = word;
      } else {
        current = test;
      }
    }
    if (current) {
      lines.push({ text: current, font: block.font, color: block.color, indent: block.indent, height: lineHeight + block.gapAfter });
    }
  }

  // 3. Chia trang, vẽ và đưa vào PDF.
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  let pageLines: Line[] = [];
  let usedHeight = 0;
  let isFirstPage = true;

  const flushPage = () => {
    if (!pageLines.length) return;

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(widthPx);
    canvas.height = Math.ceil(heightPx);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let y = 0;
    for (const line of pageLines) {
      if (line.text) {
        ctx.font = line.font;
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, line.indent, y + line.height * 0.72);
      }
      y += line.height;
    }

    if (!isFirstPage) doc.addPage();
    isFirstPage = false;

    doc.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      marginMm,
      marginMm,
      A4.widthMm - marginMm * 2,
      A4.heightMm - marginMm * 2
    );

    pageLines = [];
    usedHeight = 0;
  };

  for (const line of lines) {
    if (usedHeight + line.height > heightPx) flushPage();
    pageLines.push(line);
    usedHeight += line.height;
  }
  flushPage();

  doc.save(`${safeFileName(item.title)}.pdf`);
}

/** Xuất theo định dạng chỉ định. */
export async function exportQuestions(
  item: QuestionLibraryItem,
  format: 'pdf' | 'docx' | 'md',
  includeAnswers = true
) {
  if (format === 'md') return exportQuestionsToMarkdown(item, includeAnswers);
  if (format === 'docx') return exportQuestionsToDocx(item, includeAnswers);
  return exportQuestionsToPdf(item, includeAnswers);
}

/** Tiện ích cho phần thống kê: đếm câu theo kiểu. */
export function countByQuestionType(questions: MedicalQuestion[]): Record<string, number> {
  return questions.reduce<Record<string, number>>((acc, q) => {
    const key = q.questionType || 'khác';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export { AlignmentType };
