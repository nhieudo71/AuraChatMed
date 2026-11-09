import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/**
 * Đóng gói một PNG 512x512 thành .ico.
 *
 * Không cần thư viện chuyển đổi: định dạng ICO từ Windows Vista trở đi cho
 * phép nhúng thẳng một khối PNG thay vì bitmap thô, miễn là kích thước nằm
 * trong khoảng icon hỗ trợ. electron-builder/NSIS chỉ cần một .ico hợp lệ với
 * một kích thước đại diện — không cần bộ nhiều cỡ đầy đủ.
 */
const pngPath = path.join(root, 'public', 'pwa-512x512.png');
const icoPath = path.join(root, 'build', 'icon.ico');

const png = fs.readFileSync(pngPath);

// ICONDIR (6 bytes) + 1 x ICONDIRENTRY (16 bytes) + dữ liệu PNG
const header = Buffer.alloc(6 + 16);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = icon
header.writeUInt16LE(1, 4); // số ảnh

const entryOffset = 6;
header.writeUInt8(0, entryOffset); // width: 0 = 256px trở lên (PNG bất kỳ kích thước)
header.writeUInt8(0, entryOffset + 1); // height: 0 = tương tự
header.writeUInt8(0, entryOffset + 2); // palette
header.writeUInt8(0, entryOffset + 3); // reserved
header.writeUInt16LE(1, entryOffset + 4); // color planes
header.writeUInt16LE(32, entryOffset + 6); // bits per pixel
header.writeUInt32LE(png.length, entryOffset + 8); // kích thước dữ liệu ảnh
header.writeUInt32LE(6 + 16, entryOffset + 12); // offset tới dữ liệu ảnh

fs.writeFileSync(icoPath, Buffer.concat([header, png]));
console.log(`Đã tạo ${icoPath} (${png.length} byte PNG nhúng)`);

// Cũng chép icon PNG cho Linux/macOS build sau này nếu cần.
fs.copyFileSync(pngPath, path.join(root, 'build', 'icon.png'));
