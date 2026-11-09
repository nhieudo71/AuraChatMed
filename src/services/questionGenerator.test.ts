import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractJsonArray, verifySourceQuote } from './questionGenerator';

describe('extractJsonArray', () => {
  it('parses a clean JSON array', () => {
    const raw = '[{"question":"Q1","options":["A","B","C","D"],"correctIndex":0}]';
    const out = extractJsonArray(raw);
    assert.equal(out.length, 1);
    assert.equal(out[0].question, 'Q1');
  });

  it('strips markdown fences and prose around the array', () => {
    const raw = 'Đây là kết quả:\n```json\n[{"question":"Q1"}]\n```\nChúc bạn học tốt ]';
    const out = extractJsonArray(raw);
    assert.equal(out.length, 1);
    assert.equal(out[0].question, 'Q1');
  });

  it('recovers complete objects when the response is truncated mid-object', () => {
    // Model chạm giới hạn token: câu thứ ba đứt giữa chừng.
    const raw =
      '[{"question":"Q1","options":["A","B","C","D"],"correctIndex":0},' +
      '{"question":"Q2","options":["A","B","C","D"],"correctIndex":1},' +
      '{"question":"Q3","options":["A","B","C","D"],"correctInd';
    const out = extractJsonArray(raw);
    assert.equal(out.length, 2);
    assert.deepEqual(out.map((q) => q.question), ['Q1', 'Q2']);
  });

  it('repairs trailing commas before closing brackets', () => {
    const raw = '[{"question":"Q1",},]';
    const out = extractJsonArray(raw);
    assert.equal(out.length, 1);
    assert.equal(out[0].question, 'Q1');
  });

  it('repairs raw newlines inside string values', () => {
    const raw = '[{"question":"Dòng 1\nDòng 2","correctIndex":0}]';
    const out = extractJsonArray(raw);
    assert.equal(out.length, 1);
    assert.equal(out[0].question, 'Dòng 1\nDòng 2');
  });

  it('ignores brackets that appear inside quoted strings', () => {
    const raw = '[{"question":"Chọn [A] hoặc }B{ ?","correctIndex":0},{"question":"Q2"}]';
    const out = extractJsonArray(raw);
    assert.equal(out.length, 2);
    assert.equal(out[1].question, 'Q2');
  });

  it('throws a helpful message when no array is present', () => {
    assert.throws(() => extractJsonArray('Xin lỗi, tôi không thể tạo câu hỏi.'), /mảng JSON/);
  });

  it('throws when the array is cut before the first object completes', () => {
    const raw = '[{"question":"Q1","options":["A","B"';
    assert.throws(() => extractJsonArray(raw), /bị cắt/);
  });
});

describe('verifySourceQuote', () => {
  const doc = 'Sốt xuất huyết Dengue có ba giai đoạn: giai đoạn sốt, giai đoạn nguy hiểm và giai đoạn hồi phục.';

  it('accepts an exact quote', () => {
    assert.equal(verifySourceQuote('giai đoạn nguy hiểm và giai đoạn hồi phục', doc), true);
  });

  it('tolerates differences in quotes and whitespace', () => {
    assert.equal(verifySourceQuote('Sốt xuất huyết Dengue   có ba giai đoạn', doc), true);
  });

  it('rejects a fabricated quote', () => {
    assert.equal(verifySourceQuote('Sốt rét do ký sinh trùng Plasmodium gây ra', doc), false);
  });

  it('rejects quotes that are too short to be meaningful', () => {
    assert.equal(verifySourceQuote('sốt', doc), false);
  });
});
