import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';
import { ChatMessage } from '../types';
import { formatConversationAsMarkdown, formatConversationForSpreadsheet } from '../utils/chatUtils';

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

// 1. Export Markdown (.md)
export function exportToMarkdown(title: string, messages: ChatMessage[], systemPrompt?: string) {
  const content = formatConversationAsMarkdown(title, messages, systemPrompt);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, `${title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.md`);
}

// 2. Export Excel (.xlsx)
export function exportToExcel(title: string, messages: ChatMessage[]) {
  const rows = formatConversationForSpreadsheet(title, messages);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lịch sử chat');

  // Auto column widths
  worksheet['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 60 },
    { wch: 30 },
    { wch: 8 },
  ];

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, `${title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.xlsx`);
}

// 3. Export PDF
export function exportToPdf(title: string, messages: ChatMessage[], systemPrompt?: string) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title.slice(0, 50), 14, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Xuất bởi AuraChat AI - ${new Date().toLocaleString()}`, 14, y);
  y += 12;

  // System Prompt Box if present
  if (systemPrompt && systemPrompt.trim()) {
    doc.setFillColor(245, 245, 247);
    doc.rect(14, y, pageWidth - 28, 16, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    const splitSys = doc.splitTextToSize(`System Prompt: ${systemPrompt}`, pageWidth - 32);
    doc.text(splitSys.slice(0, 2), 17, y + 6);
    y += 22;
  }

  // Messages
  for (const m of messages) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    const isUser = m.role === 'user';
    const roleLabel = isUser ? 'Người dùng' : m.role === 'model' ? 'Aura AI' : 'Hệ thống';
    const timeStr = new Date(m.createdAt).toLocaleTimeString();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(isUser ? 30 : 50, isUser ? 90 : 150, isUser ? 200 : 80);
    doc.text(`${roleLabel} (${timeStr})`, 14, y);
    y += 6;

    if (m.thinkingContent) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      const splitThinking = doc.splitTextToSize(`[Suy nghĩ]: ${m.thinkingContent}`, pageWidth - 32);
      for (const line of splitThinking.slice(0, 5)) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, 16, y);
        y += 4;
      }
      y += 2;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    const splitContent = doc.splitTextToSize(m.content, pageWidth - 28);
    for (const line of splitContent) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 5;
    }
    y += 6;
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.pdf`);
}

// 4. Export Word (.docx)
export async function exportToWord(title: string, messages: ChatMessage[], systemPrompt?: string) {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Xuất bởi AuraChat AI | Ngày tạo: ${new Date().toLocaleString()}`,
          italics: true,
          color: '666666',
        }),
      ],
    }),
    new Paragraph({ text: '' }),
  ];

  if (systemPrompt) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `[Chỉ dẫn hệ thống]: ${systemPrompt}`,
            italics: true,
            color: '555555',
          }),
        ],
      }),
      new Paragraph({ text: '' })
    );
  }

  for (const m of messages) {
    const role = m.role === 'user' ? 'Người dùng' : m.role === 'model' ? 'Aura AI' : 'Hệ thống';
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${role} (${new Date(m.createdAt).toLocaleTimeString()}):`,
            bold: true,
            color: m.role === 'user' ? '2563EB' : '059669',
          }),
        ],
      })
    );

    if (m.thinkingContent) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Quá trình suy nghĩ]: ${m.thinkingContent}`,
              italics: true,
              color: '888888',
            }),
          ],
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: m.content,
          }),
        ],
      }),
      new Paragraph({ text: '----------------------------------------' }),
      new Paragraph({ text: '' })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, `${title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.docx`);
}

// 5. Export PowerPoint (.pptx)
export async function exportToPowerPoint(title: string, messages: ChatMessage[]) {
  const pres = new pptxgen();
  pres.title = title;

  // Title Slide
  const titleSlide = pres.addSlide();
  titleSlide.addText(title, {
    x: 1,
    y: 1.5,
    w: 8,
    h: 1.5,
    fontSize: 32,
    bold: true,
    color: '363636',
  });
  titleSlide.addText(`AuraChat AI Conversation Export\n${new Date().toLocaleString()}`, {
    x: 1,
    y: 3.2,
    w: 8,
    h: 1,
    fontSize: 16,
    color: '7A7A7A',
  });

  // Group messages into slides
  for (let i = 0; i < messages.length; i += 2) {
    const slide = pres.addSlide();
    const userMsg = messages[i];
    const aiMsg = messages[i + 1];

    slide.addText(`Chủ đề #${Math.floor(i / 2) + 1}`, {
      x: 0.8,
      y: 0.5,
      w: 8.4,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: '2563EB',
    });

    if (userMsg) {
      slide.addText(`Người dùng: ${userMsg.content.slice(0, 300)}`, {
        x: 0.8,
        y: 1.2,
        w: 8.4,
        h: 2.0,
        fontSize: 13,
        bold: true,
        color: '1E293B',
      });
    }

    if (aiMsg) {
      slide.addText(`Aura AI: ${aiMsg.content.slice(0, 500)}`, {
        x: 0.8,
        y: 3.4,
        w: 8.4,
        h: 3.2,
        fontSize: 12,
        color: '334155',
      });
    }
  }

  await pres.writeFile({ fileName: `${title.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')}.pptx` });
}
