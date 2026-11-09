import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startServer } from './app';
import type { RunningServer } from './app';

describe('startServer', () => {
  let server: RunningServer;
  // Thư mục rỗng đủ để kiểm tra server lắng nghe và trả JSON; không cần build
  // thật, vì smoke test này chỉ xác nhận vòng đời cổng/health, không phải nội
  // dung giao diện.
  const distDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aurachat-smoke-'));
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>');

  after(async () => {
    await server?.close();
    fs.rmSync(distDir, { recursive: true, force: true });
  });

  it('listens on an OS-assigned port when port 0 is requested', async () => {
    server = await startServer(distDir, 0, '127.0.0.1');
    assert.ok(server.port > 0);
    assert.equal(server.url, `http://127.0.0.1:${server.port}`);
  });

  it('responds to the health check Electron polls before showing the window', async () => {
    const res = await fetch(`${server.url}/api/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.deepEqual(body, { ok: true });
  });

  it('serves the static dist directory for unknown routes (SPA fallback)', async () => {
    const res = await fetch(`${server.url}/some/client/route`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.match(text, /<html>/);
  });

  it('closes cleanly and releases the port', async () => {
    const closable = await startServer(distDir, 0, '127.0.0.1');
    await closable.close();
    // Cổng đã nhả: mở lại server khác trên cùng cổng cố định phải thành công.
    const reopened = await startServer(distDir, closable.port, '127.0.0.1');
    assert.equal(reopened.port, closable.port);
    await reopened.close();
  });
});
