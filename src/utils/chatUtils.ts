import { ChatMessage } from '../types';

/**
 * Extracts a concise title (under 50 chars) from the initial user prompt.
 */
export function generateChatTitle(firstPrompt: string): string {
  if (!firstPrompt) return 'Cuộc trò chuyện mới';
  const clean = firstPrompt.trim().replace(/\s+/g, ' ');
  if (clean.length <= 40) return clean;
  return clean.slice(0, 37).trimEnd() + '...';
}

/**
 * Converts a list of chat messages into clean Markdown format.
 */
export function formatConversationAsMarkdown(title: string, messages: ChatMessage[], systemPrompt?: string): string {
  let output = `# ${title}\n\n`;
  output += `*Ngày tạo: ${new Date().toLocaleString()}*\n\n`;

  if (systemPrompt && systemPrompt.trim()) {
    output += `### System Instruction\n> ${systemPrompt.trim().replace(/\n/g, '\n> ')}\n\n---\n\n`;
  }

  for (const msg of messages) {
    const roleName = msg.role === 'user' ? 'Người dùng' : msg.role === 'model' ? 'Aura AI' : 'Hệ thống';
    output += `### ${roleName} (${new Date(msg.createdAt).toLocaleTimeString()})\n\n`;
    if (msg.thinkingContent) {
      output += `<details>\n<summary>Quá trình suy nghĩ</summary>\n\n${msg.thinkingContent}\n\n</details>\n\n`;
    }
    output += `${msg.content}\n\n---\n\n`;
  }

  return output.trim();
}

/**
 * Prepares tabular data rows for Spreadsheet / Excel export.
 */
export function formatConversationForSpreadsheet(title: string, messages: ChatMessage[]): Array<{ [key: string]: string | number }> {
  return messages.map((msg, index) => ({
    STT: index + 1,
    Thời_gian: new Date(msg.createdAt).toLocaleString(),
    Vai_trò: msg.role === 'user' ? 'Người dùng' : msg.role === 'model' ? 'Aura AI' : 'Hệ thống',
    Nội_dung: msg.content,
    Suy_nghĩ: msg.thinkingContent || '',
    Số_từ: msg.content.trim().split(/\s+/).filter(Boolean).length,
  }));
}

/**
 * Calculates statistics for a conversation.
 */
export function getConversationStats(messages: ChatMessage[]): { userCount: number; aiCount: number; totalWords: number } {
  let userCount = 0;
  let aiCount = 0;
  let totalWords = 0;

  for (const m of messages) {
    if (m.role === 'user') userCount++;
    if (m.role === 'model') aiCount++;
    totalWords += m.content.trim().split(/\s+/).filter(Boolean).length;
  }

  return { userCount, aiCount, totalWords };
}
