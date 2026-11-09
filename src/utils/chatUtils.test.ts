import test from 'node:test';
import assert from 'node:assert/strict';
import { generateChatTitle, formatConversationAsMarkdown, formatConversationForSpreadsheet, getConversationStats } from './chatUtils';
import { ChatMessage } from '../types';

test('generateChatTitle shortens long titles accurately', () => {
  assert.equal(generateChatTitle('Xin chào!'), 'Xin chào!');
  const longPrompt = 'Đây là một câu hỏi rất dài vượt quá giới hạn 40 ký tự để kiểm tra việc rút gọn tiêu đề tự động';
  const title = generateChatTitle(longPrompt);
  assert.ok(title.endsWith('...'));
  assert.ok(title.length <= 40);
  assert.equal(generateChatTitle(''), 'Cuộc trò chuyện mới');
});

test('formatConversationAsMarkdown formats messages correctly', () => {
  const sampleMessages: ChatMessage[] = [
    {
      id: '1',
      sessionId: 's1',
      userId: 'u1',
      role: 'user',
      content: 'Chào bạn',
      createdAt: '2026-11-09T10:00:00Z',
    },
    {
      id: '2',
      sessionId: 's1',
      userId: 'u1',
      role: 'model',
      content: 'Chào bạn! Mình có thể giúp gì?',
      thinkingContent: 'Phân tích câu chào',
      createdAt: '2026-11-09T10:00:05Z',
    },
  ];

  const md = formatConversationAsMarkdown('Hội thoại mẫu', sampleMessages, 'Bạn là trợ lý thân thiện');
  assert.ok(md.includes('# Hội thoại mẫu'));
  assert.ok(md.includes('System Instruction'));
  assert.ok(md.includes('Bạn là trợ lý thân thiện'));
  assert.ok(md.includes('Người dùng'));
  assert.ok(md.includes('Aura AI'));
  assert.ok(md.includes('Phân tích câu chào'));
});

test('getConversationStats calculates counts and words', () => {
  const sampleMessages: ChatMessage[] = [
    {
      id: '1',
      sessionId: 's1',
      userId: 'u1',
      role: 'user',
      content: 'Một hai ba bốn',
      createdAt: '2026-11-09T10:00:00Z',
    },
    {
      id: '2',
      sessionId: 's1',
      userId: 'u1',
      role: 'model',
      content: 'Năm sáu bảy',
      createdAt: '2026-11-09T10:00:05Z',
    },
  ];

  const stats = getConversationStats(sampleMessages);
  assert.equal(stats.userCount, 1);
  assert.equal(stats.aiCount, 1);
  assert.equal(stats.totalWords, 7);

  const sheetData = formatConversationForSpreadsheet('Test', sampleMessages);
  assert.equal(sheetData.length, 2);
  assert.equal(sheetData[0].STT, 1);
  assert.equal(sheetData[0].Vai_trò, 'Người dùng');
});
