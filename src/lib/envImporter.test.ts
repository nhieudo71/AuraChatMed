import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvFile, planEnvImport, isUsableBaseUrl } from './envImporter';

describe('parseEnvFile', () => {
  it('parses simple KEY=value pairs', () => {
    const entries = parseEnvFile('GEMINI_API_KEY=abc123\nGROQ_API_KEY=xyz789');
    assert.equal(entries.length, 2);
    assert.deepEqual(
      entries.map((e) => [e.key, e.value]),
      [
        ['GEMINI_API_KEY', 'abc123'],
        ['GROQ_API_KEY', 'xyz789'],
      ]
    );
  });

  it('skips comments and blank lines', () => {
    const entries = parseEnvFile('# chú thích\n\nGROQ_API_KEY=abc\n   \n# khác');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].key, 'GROQ_API_KEY');
  });

  it('strips surrounding double quotes without breaking inner spaces', () => {
    const entries = parseEnvFile('OPENAI_API_KEY="sk-abc 123"');
    assert.equal(entries[0].value, 'sk-abc 123');
  });

  it('strips surrounding single quotes', () => {
    const entries = parseEnvFile("MISTRAL_API_KEY='abc123'");
    assert.equal(entries[0].value, 'abc123');
  });

  it('removes an export prefix copied from a shell script', () => {
    const entries = parseEnvFile('export GROQ_API_KEY=abc');
    assert.equal(entries[0].key, 'GROQ_API_KEY');
    assert.equal(entries[0].value, 'abc');
  });

  it('handles CRLF line endings from Windows', () => {
    const entries = parseEnvFile('GROQ_API_KEY=abc\r\nOPENAI_API_KEY=def\r\n');
    assert.equal(entries.length, 2);
    assert.equal(entries[0].value, 'abc');
    assert.equal(entries[1].value, 'def');
  });

  it('keeps equals signs that belong to the value', () => {
    const entries = parseEnvFile('SOME_API_KEY=abc==def=');
    assert.equal(entries[0].value, 'abc==def=');
  });

  it('drops inline comments only when unquoted', () => {
    assert.equal(parseEnvFile('A_API_KEY=abc # ghi chú')[0].value, 'abc');
    assert.equal(parseEnvFile('B_API_KEY="abc # không phải chú thích"')[0].value, 'abc # không phải chú thích');
  });

  it('ignores empty values', () => {
    assert.equal(parseEnvFile('GROQ_API_KEY=').length, 0);
    assert.equal(parseEnvFile('GROQ_API_KEY=""').length, 0);
  });

  it('records the line number for error reporting', () => {
    const entries = parseEnvFile('# a\n# b\nGROQ_API_KEY=x');
    assert.equal(entries[0].line, 3);
  });
});

describe('planEnvImport', () => {
  it('maps known env var names to catalog services', () => {
    const plan = planEnvImport('GROQ_API_KEY=gsk_test\nDEEPSEEK_API_KEY=sk_test');
    const names = plan.candidates.map((c) => c.name);
    assert.ok(names.includes('Groq LPUs'));
    assert.ok(plan.candidates.find((c) => c.envKey === 'GROQ_API_KEY')?.baseUrl.includes('groq'));
  });

  it('recognises alternative names for the same service', () => {
    const plan = planEnvImport('HF_TOKEN=hf_test');
    assert.equal(plan.candidates.length, 1);
    assert.equal(plan.candidates[0].serviceId, 'huggingface-serverless');
  });

  it('keeps only the first key when a service appears twice', () => {
    const plan = planEnvImport('OPENAI_API_KEY=first\nCLAUDE_API_KEY=claude\n');
    const openai = plan.candidates.filter((c) => c.serviceId === 'openai');
    assert.equal(openai.length, 1);
    assert.equal(openai[0].apiKey, 'first');
  });

  it('skips configuration variables that are not API keys', () => {
    const plan = planEnvImport('GROQ_API_KEY=abc\nGROQ_BASE_URL=https://x.dev\nPORT=3000');
    const skippedKeys = plan.skipped.map((s) => s.entry.key);
    assert.ok(skippedKeys.includes('GROQ_BASE_URL'));
    assert.equal(plan.candidates.length, 1);
  });

  it('reports variables it cannot map', () => {
    const plan = planEnvImport('SOME_RANDOM_VENDOR_KEY=abc');
    assert.equal(plan.candidates.length, 0);
    assert.equal(plan.unknown.length, 1);
    assert.equal(plan.unknown[0].key, 'SOME_RANDOM_VENDOR_KEY');
  });

  it('detects base URLs that still need a placeholder filled in', () => {
    assert.equal(isUsableBaseUrl('https://api.groq.com/openai/v1'), true);
    assert.equal(isUsableBaseUrl('https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1'), false);
    assert.equal(isUsableBaseUrl('https://your-workspace.cloud.databricks.com/serving-endpoints'), false);
    assert.equal(isUsableBaseUrl('https://{region}.tts.speech.microsoft.com/cognitiveservices/v1'), false);
  });

  it('still imports a service whose base URL is concrete', () => {
    const plan = planEnvImport('AZURE_OPENAI_API_KEY=abc');
    assert.equal(plan.candidates.length, 1);
    assert.equal(plan.candidates[0].serviceId, 'azure-ai-inference');
  });

  it('carries the default model through from the catalog', () => {
    const plan = planEnvImport('GROQ_API_KEY=abc');
    assert.ok(plan.candidates[0].selectedModel.length > 0);
    assert.ok(plan.candidates[0].models.length > 0);
  });
});
