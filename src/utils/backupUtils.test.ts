import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackupPayload, parseApiKeysBackup } from './backupUtils';
import { CustomProviderConfig } from '../types';

test('createBackupPayload and parseApiKeysBackup handle valid payloads', () => {
  const sampleProviders: CustomProviderConfig[] = [
    {
      id: 'p1',
      name: 'Groq Cloud',
      category: 'llm',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: 'enc_sample_key',
      models: ['llama-3.3-70b-versatile'],
      selectedModel: 'llama-3.3-70b-versatile',
      updatedAt: '2026-11-09T10:00:00Z',
    },
  ];

  const payload = createBackupPayload(sampleProviders, { theme: 'dark', language: 'vi' });
  assert.equal(payload.app, 'AuraChat');
  assert.equal(payload.providers.length, 1);
  assert.equal(payload.providers[0].name, 'Groq Cloud');

  const jsonStr = JSON.stringify(payload);
  const restored = parseApiKeysBackup(jsonStr);

  assert.equal(restored.app, 'AuraChat');
  assert.equal(restored.providers.length, 1);
  assert.equal(restored.providers[0].baseUrl, 'https://api.groq.com/openai/v1');
});

test('parseApiKeysBackup rejects invalid payloads', () => {
  assert.throws(() => parseApiKeysBackup('not json'), {
    message: /Tệp sao lưu không đúng định dạng JSON hợp lệ/,
  });

  assert.throws(() => parseApiKeysBackup(JSON.stringify({ app: 'OtherApp' })), {
    message: /Tệp sao lưu không phải định dạng hợp lệ/,
  });
});
