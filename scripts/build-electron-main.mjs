import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/**
 * Biên dịch tiến trình chính Electron sang CommonJS.
 *
 * Vì sao không chạy electron/main.ts trực tiếp qua tsx trong bản đóng gói:
 * electron-builder đóng gói mã nguồn vào asar rồi chạy bằng Electron's Node
 * runtime, không có tsx. Phải có sẵn JS đã biên dịch trước khi đóng gói.
 *
 * `platform: 'node'` + `external: ['electron']` giữ nguyên `require('electron')`
 * để Electron tự inject binding gốc của nó, không bundle nhầm.
 */
await build({
  entryPoints: [path.join(root, 'electron', 'main.ts')],
  outfile: path.join(root, 'dist-electron', 'main.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  // esbuild giữ nguyên import động của Express/dotenv; không cần externalize
  // vì node_modules vẫn nằm trong asar (asarUnpack áp cho native thôi).
  logLevel: 'info',
});

console.log('Đã biên dịch tiến trình chính Electron -> dist-electron/main.cjs');
