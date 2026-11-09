/**
 * Tiến trình chính của Electron.
 *
 * Kiến trúc: ứng dụng KHÔNG nạp trang bằng file://. Thay vào đó nó khởi động
 * chính Express server đã dùng ở bản web, lắng nghe trên một cổng trống do hệ
 * điều hành cấp, rồi mở cửa sổ trỏ vào cổng đó.
 *
 * Vì sao không dùng file://: ứng dụng gọi API nội bộ qua đường dẫn tương đối
 * (`/api/chat/stream`). Với file:// thì gốc là ổ đĩa và mọi lần gọi đều thất
 * bại. Chạy qua HTTP nội bộ giữ nguyên mã phía client, không phải sửa gì trong
 * ứng dụng web.
 */
import { app, BrowserWindow, shell, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { startServer } from '../src/server/app';
import type { RunningServer } from '../src/server/app';

let mainWindow: BrowserWindow | null = null;
let runningServer: RunningServer | null = null;

/**
 * Nạp tệp .env đặt cạnh file chạy.
 *
 * Bản portable được thiết kế để người dùng dán khóa API vào một tệp .env ngay
 * cạnh file .exe. Phải đọc trước khi import cấu hình máy chủ, nếu không các
 * hằng số mô hình sẽ chốt giá trị mặc định.
 */
function loadEnvFromAppDirectory(): void {
  const candidates: string[] = [];

  // 1. Cạnh file .exe (bản portable / bản cài đặt)
  if (app.isPackaged) {
    candidates.push(path.join(path.dirname(app.getPath('exe')), '.env'));
    // 2. Thư mục dữ liệu người dùng — chỗ ghi được khi cài vào Program Files
    candidates.push(path.join(app.getPath('userData'), '.env'));
  } else {
    candidates.push(path.join(app.getAppPath(), '.env'));
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        dotenv.config({ path: candidate, override: true });
        return;
      }
    } catch {
      /* thử đường dẫn kế tiếp */
    }
  }
}

/** Thư mục chứa bản build tĩnh của Vite, nằm trong asar khi đóng gói. */
function resolveDistDir(): string {
  return app.isPackaged
    ? path.join(app.getAppPath(), 'dist')
    : path.join(app.getAppPath(), 'dist');
}

function createWindow(url: string): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 420,
    minHeight: 560,
    show: false,
    backgroundColor: '#0c0a09',
    title: 'AuraChat AI',
    icon: path.join(app.getAppPath(), 'build', 'icon.png'),
    webPreferences: {
      // Không cần Node trong giao diện: mọi việc hệ thống đi qua server nội bộ.
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Liên kết ngoài mở bằng trình duyệt mặc định, không mở trong cửa sổ app.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (target.startsWith('http://127.0.0.1') || target.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    void shell.openExternal(target);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  void mainWindow.loadURL(url);
}

async function bootstrap(): Promise<void> {
  loadEnvFromAppDirectory();

  // Cổng 0 = hệ điều hành tự chọn cổng trống, tránh đụng cổng đang bị chiếm.
  runningServer = await startServer(resolveDistDir(), 0, '127.0.0.1');

  createWindow(runningServer.url);
}

// Chỉ cho một bản chạy: mở lần thứ hai sẽ đưa cửa sổ cũ lên trước.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(bootstrap).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    dialog.showErrorBox(
      'Không khởi động được AuraChat',
      `Máy chủ nội bộ không khởi động được.\n\n${message}\n\nHãy thử chạy lại ứng dụng với quyền quản trị.`
    );
    app.quit();
  });

  app.on('activate', () => {
    // macOS: bấm biểu tượng trên Dock khi không còn cửa sổ nào.
    if (BrowserWindow.getAllWindows().length === 0 && runningServer) {
      createWindow(runningServer.url);
    }
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    void runningServer?.close();
    runningServer = null;
  });
}
