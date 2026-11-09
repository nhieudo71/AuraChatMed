import test from 'node:test';
import assert from 'node:assert/strict';
import { formatFileSize } from './fileParser';

test('formatFileSize formats bytes, KB, and MB accurately', () => {
  assert.equal(formatFileSize(0), '0 B');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(1024), '1.0 KB');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(1024 * 1024), '1.0 MB');
  assert.equal(formatFileSize(5.5 * 1024 * 1024), '5.5 MB');
});
