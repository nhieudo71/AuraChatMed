import express from 'express';
import path from 'path';
import type { Server } from 'http';
import {
  handleChatStream,
  handleTranscribeAudio,
  handleFetchModels,
  handleTestModel,
} from '../services/geminiServer';

/**
 * Dựng Express app phục vụ cả API và bản build tĩnh của Vite.
 *
 * Tách khỏi `server.ts` để Electron dùng lại đúng logic — nếu để trong
 * `server.ts` thì bản đóng gói và bản chạy CLI sẽ lệch nhau theo thời gian.
 */
export function createApp(distDir: string) {
  const app = express();

  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  app.post('/api/chat/stream', (req, res) => handleChatStream(req, res));
  app.post('/api/transcribe', (req, res) => handleTranscribeAudio(req, res));
  app.post('/api/models/fetch', (req, res) => handleFetchModels(req, res));
  app.post('/api/models/test', (req, res) => handleTestModel(req, res));

  // Kiểm tra sống: Electron gọi để biết server đã sẵn sàng nhận request.
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(express.static(distDir));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });

  return app;
}

export interface RunningServer {
  port: number;
  url: string;
  close: () => Promise<void>;
}

/**
 * Khởi động server và trả về cổng thực tế đã mở.
 *
 * `port = 0` cho hệ điều hành tự chọn cổng trống — đây là mặc định khi chạy
 * trong Electron, vì cổng cố định 3000/6768 rất dễ bị app khác chiếm và người
 * dùng sẽ thấy màn hình trắng mà không hiểu vì sao.
 */
export function startServer(
  distDir: string,
  port = 0,
  host = '127.0.0.1'
): Promise<RunningServer> {
  return new Promise((resolve, reject) => {
    const app = createApp(distDir);

    const server: Server = app.listen(port, host);

    server.once('listening', () => {
      const address = server.address();
      const actualPort =
        typeof address === 'object' && address !== null ? address.port : port;

      resolve({
        port: actualPort,
        url: `http://${host}:${actualPort}`,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => done());
          }),
      });
    });

    server.once('error', reject);
  });
}
