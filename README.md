# 🌟 AuraChat AI — Trợ Lý AI Tối Giản, Đa Năng & Ôn Luyện Y Khoa

[![React 19](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%26%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

> **AuraChat AI** là ứng dụng web trò chuyện trí tuệ nhân tạo thế hệ mới được thiết kế theo phong cách tối giản, tốc độ truyền phát thời gian thực (Zero-Wait Streaming), hỗ trợ đọc đa tài liệu (PDF, Word, Excel, PowerPoint, Ảnh, Video), tích hợp không gian học tập chuyên sâu cho sinh viên Y khoa, cùng hệ thống quản lý hơn 100+ dịch vụ khóa API bảo mật bằng mã hóa AES-GCM 256-bit.

---

## 📑 Mục Lục

- [Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
- [Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Hướng Dẫn Cài Đặt & Chạy Cục Bộ](#-hướng-dẫn-cài-đặt--chạy-cục-bộ)
- [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
- [Hướng Dẫn Sử Dụng Chi Tiết](#-hướng-dẫn-sử-dụng-chi-tiết)
  - [1. Tùy Chọn Cấp Độ Trả Lời & Chế Độ Siêu Tốc](#1-tùy-chọn-cấp-độ-trả-lời--chế-độ-siêu-tốc)
  - [2. Tải & Phân Tích Đa Tài Liệu](#2-tải--phân-tích-đa-tài-liệu)
  - [3. Không Gian Y Khoa Dành Cho Sinh Viên & Bác Sĩ](#3-không-gian-y-khoa-dành-cho-sinh-viên--bác-sĩ)
  - [4. Quản Lý 100+ Dịch Vụ API Key & Mã Hóa An Toàn](#4-quản-lý-100-dịch-vụ-api-key--mã-hóa-an-toàn)
  - [5. Xuất Cuộc Trò Chuyện & Đồng Bộ Đám Mây](#5-xuất-cuộc-trò-chuyện--đồng-bộ-đám-mây)
- [Kiểm Thử & Đảm Bảo Chất Lượng](#-kiểm-thử--đảm-bảo-chất-lượng)
- [Triển Khai (Deployment)](#-triển-khai-deployment)
- [Bảo Mật & Quyền Riêng Tư](#-bảo-mật--quyền-riêng-tư)
- [Giấy Phép](#-giấy-phép)

---

## ✨ Tính Năng Nổi Bật

### ⚡ 1. Truyền Phát Siêu Tốc (Zero-Wait Streaming)
- Cơ chế **Server-Sent Events (SSE)** không đệm (`X-Accel-Buffering: no`), heartbeat ping tức thời giải phóng độ trễ phản hồi.
- Tùy chọn **⚡ Siêu tốc**: Tự động cấu hình `thinkingBudget: 0`, bỏ qua chuỗi suy nghĩ nội bộ để phản hồi ngay trong tích tắc.
- **Bộ 3 cấp độ trả lời phong cách ChatGPT**:
  - `⚡ Ngắn gọn (Concise)`: Đi thẳng vào trọng tâm, câu trả lời súc tích, gạch đầu dòng rõ ràng, loại bỏ hoàn toàn các câu chào/kết thừa.
  - `⚖️ Tiêu chuẩn (Balanced)`: Cân bằng tự nhiên giữa sự ngắn gọn và mức độ giải thích.
  - `📚 Chi tiết (Detailed)`: Phân tích chuyên sâu, toàn diện với cơ chế và ví dụ minh họa.

### 📎 2. Đọc & Phân Tích Mọi Loại Tài Liệu
- **Tài liệu văn phòng**:
  - **PDF**: Trích xuất base64 và gửi trực tiếp qua Gemini Multimodal `inlineData`.
  - **Word (`.docx`, `.doc`)**: Bóc tách nội dung văn bản sạch qua thư viện `mammoth`.
  - **Excel (`.xlsx`, `.xls`, `.csv`)**: Tự động chuyển đổi các bảng tính (Sheets) thành bảng Markdown có cấu trúc để AI hiểu quan hệ hàng/cột.
  - **PowerPoint (`.pptx`, `.ppt`)**: Tự động giải nén XML qua `jszip` và bóc tách từng slide thuyết trình.
  - **Văn bản thuần & Markdown (`.txt`, `.md`)**: Đọc nhanh bằng mã hóa UTF-8.
- **Đa phương tiện**: Hình ảnh (JPEG, PNG, WebP) và Video (MP4, WebM) kèm trình xem trước và lightbox phóng to.

### 🩺 3. Module Chuyên Dụng Cho Sinh Viên Ngành Y
- **Hội chẩn & Ca lâm sàng**: Mô phỏng bệnh án Socratic phản biện chẩn đoán phân biệt, cận lâm sàng, phác đồ điều trị.
- **Tạo đề trắc nghiệm (MCQ)**: Tạo câu hỏi ôn thi học kỳ, thi tốt nghiệp, USMLE Step 1/2 với giải thích chi tiết từng đáp án đúng/sai.
- **Bộ máy tính y khoa chuẩn mực (Validated Calculators)**:
  - Thang điểm hôn mê **Glasgow (GCS)**: Tự động cảnh báo đặt nội khí quản khi GCS ≤ 8.
  - Đánh giá độ nặng viêm phổi **CURB-65**: Phân tầng nguy cơ tử vong và định hướng nhập viện/ICU.
  - Đánh giá khả năng viêm ruột thừa cấp **Alvarado Score**: Chỉ định hội chẩn ngoại khoa.
  - Đánh giá nguy cơ đột quỵ rung nhĩ **CHA2DS2-VASc**: Khuyến nghị dùng thuốc chống đông.
  - Nhận diện sớm nhiễm khuẩn huyết **qSOFA Score**: Cảnh báo Sepsis khi điểm ≥ 2.

### 🔑 4. Quản Lý Khóa API Đa Dịch Vụ & Danh Mục 100+ Nhà Cung Cấp
- Tùy chỉnh **Base URL** linh hoạt: Hỗ trợ mọi dịch vụ tương thích chuẩn OpenAI (Groq, DeepSeek, OpenRouter, Together AI, Mistral, Ollama, v.v.).
- Tự động lấy danh sách Model (`Auto Fetch Models`) và kiểm tra kết nối với đo lường độ trễ (Latency PING).
- Hỗ trợ cấu hình riêng biệt cho: **Mô hình ngôn ngữ (LLM)**, **Chuyển văn bản thành giọng nói (Voice TTS - ElevenLabs)**, và **Tạo Ảnh/Video (Midjourney, DALL-E, Kling, Runway, HuggingFace)**.
- **Bảo mật tối đa**: Mã hóa khóa API bằng thuật toán **AES-GCM 256-bit** với khóa dẫn xuất PBKDF2 ngay trên trình duyệt (Client-side Vault).
- Hỗ trợ **Sao lưu (Backup JSON)** và **Khôi phục (Restore)** danh sách khóa API an toàn về máy tính.

### ☁️ 5. Đồng Bộ Đa Thiết Bị & Xuất Dữ Liệu Chuyên Nghiệp
- **Đồng bộ hóa 2 chiều**: Tự động lưu trữ thời gian thực lên **Firebase Firestore** khi đăng nhập Google, kèm chế độ lưu trữ cục bộ **LocalStorage** mượt mà khi dùng ngoại tuyến.
- **Xuất dữ liệu 5 định dạng**:
  - 📄 **PDF** chuẩn in ấn A4.
  - 📝 **Microsoft Word (.docx)** định dạng tài liệu hoàn chỉnh.
  - 📊 **Microsoft Excel (.xlsx)** bảng tính lưu trữ chi tiết thời gian, lượt hỏi, số từ.
  - 📑 **Microsoft PowerPoint (.pptx)** bộ slide tóm tắt theo từng chủ đề.
  - 💻 **Markdown (.md)** định dạng nguồn mở tiện lợi lưu trữ ghi chú.
- **Tích hợp Google Workspace**: Xuất trực tiếp bản ghi cuộc trò chuyện vào Google Docs, Google Sheets hoặc lưu trên Google Drive qua OAuth.

### 📱 6. PWA & Giao Diện Mobile-First Tối Giản
- Cài đặt như ứng dụng gốc (**Progressive Web App**) trên Windows, macOS, Android và iOS.
- Chế độ sáng / tối mượt mà (Dark / Light / System Mode).
- Thanh điều hướng thông minh bên dưới (Bottom Navigation Bar) tối ưu trải nghiệm ngón tay cái trên điện thoại.
- Giọng đọc phản hồi AI tự động (Web Speech API) và nhận diện giọng nói đa ngôn ngữ.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

| Thành Phần | Công Nghệ |
| :--- | :--- |
| **Giao diện (Frontend)** | React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion |
| **Công cụ đóng gói** | Vite 6, `@vitejs/plugin-react`, `vite-plugin-pwa` |
| **Xử lý tài liệu** | `xlsx` (Excel), `mammoth` (Word), `jszip` (PowerPoint), `jspdf`, `docx`, `pptxgenjs` |
| **Bảo mật & Mã hóa** | Web Crypto API (SubtleCrypto: AES-GCM 256-bit, PBKDF2 SHA-256) |
| **Máy chủ phát triển** | Node.js, Express middleware (tích hợp trong `vite.config.ts`), `tsx` |
| **Cơ sở dữ liệu & Auth**| Firebase Firestore, Firebase Authentication (Google OAuth) |
| **Mô hình AI mặc định** | Google Gemini API (`gemini-3.8-flash`, `gemini-4-argon`) qua `@google/genai` |
| **Kiểm thử logic thuần** | Node.js Native Test Runner (`node:test`, `node:assert/strict`) |

---

## 📂 Cấu Trúc Thư Mục

```text
├── index.html                  # HTML entry point với thẻ meta SEO & PWA
├── metadata.json               # Cấu hình AI Studio Applet
├── package.json                # Danh sách dependencies & script lệnh
├── tsconfig.json               # Cấu hình TypeScript ES2022
├── vite.config.ts              # Cấu hình Vite, Tailwind v4, PWA & Server API Middleware
├── server.ts                   # Entry point máy chủ Express phục vụ Production
├── firestore.rules             # Quy tắc bảo mật Firestore RBAC
├── firebase-blueprint.json     # Lược đồ dữ liệu Firebase Collections
│
├── src/
│   ├── main.tsx                # Điểm khởi động ứng dụng React
│   ├── App.tsx                 # Điều phối state chính, luồng chat, SSE & Modals
│   ├── index.css               # Định nghĩa theme toàn cục & Tailwind CSS v4
│   ├── config/
│   │   └── appConfig.ts        # Cấu hình trung tâm đọc từ biến môi trường
│   ├── types/
│   │   └── index.ts            # Định nghĩa toàn bộ TypeScript Interfaces & Types
│   ├── lib/
│   │   ├── firebase.ts         # Khởi tạo SDK Firebase Auth & Firestore sync
│   │   └── export.ts           # Xử lý xuất file PDF, DOCX, XLSX, PPTX, MD
│   ├── services/
│   │   ├── geminiServer.ts     # Proxy xử lý SSE chat stream, transribe, test model
│   │   └── workspaceService.ts # Tích hợp Google Drive, Docs, Sheets API
│   ├── utils/
│   │   ├── chatUtils.ts        # Tiện ích tạo tiêu đề, Markdown, thống kê hội thoại
│   │   ├── crypto.ts           # Mã hóa & giải mã AES-GCM 256-bit cho API Key
│   │   ├── fileParser.ts       # Bộ đọc & bóc tách văn bản từ PDF, Word, Excel, PPTX
│   │   └── backupUtils.ts      # Sao lưu & khôi phục danh mục API Key dạng JSON
│   ├── data/
│   │   └── apiCatalog.ts       # Danh mục hơn 100+ nhà cung cấp dịch vụ AI
│   └── components/
│       ├── Navbar.tsx          # Thanh công cụ trên cùng
│       ├── Sidebar.tsx         # Ngăn lịch sử chat, tài khoản & liên kết nhanh
│       ├── ChatArea.tsx        # Vùng hiển thị tin nhắn, file đính kèm & thinking
│       ├── ChatInput.tsx       # Khung nhập liệu, chọn cấp độ phản hồi, kéo thả tệp
│       ├── MobileBottomNav.tsx # Thanh điều hướng di động ngón tay cái
│       ├── SettingsModal.tsx   # Cài đặt giao diện, ngôn ngữ, giọng đọc
│       ├── SystemPromptModal.tsx # Quản lý chỉ dẫn hệ thống & bộ nhớ ngữ cảnh
│       ├── ExportModal.tsx     # Cửa sổ tùy chọn định dạng xuất file
│       ├── VoiceModal.tsx      # Giao diện nhận diện & chuyển đổi giọng nói
│       ├── APIKeyManagerModal.tsx # Quản lý & kiểm tra khóa API tùy chỉnh
│       ├── WorkspaceModal.tsx  # Cửa sổ xuất trực tiếp sang Google Workspace
│       └── medical/
│           ├── MedicalExamModal.tsx # Bộ công cụ tổng hợp ôn thi Y khoa
│           └── medicalCalculators.ts # Các công thức tính điểm lâm sàng chuẩn
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản 20 trở lên (khuyến nghị 22.x LTS)
- **Trình quản lý gói**: `npm` hoặc `bun`

### 2. Tải Mã Nguồn & Cài Đặt Gói Phụ Thuộc
```bash
# Clone repository về máy tính
git clone https://github.com/your-username/aurachat-ai.git

# Di chuyển vào thư mục dự án
cd aurachat-ai

# Cài đặt tất cả dependencies
npm install
```

### 3. Cấu Hình Biến Môi Trường
Sao chép tệp mẫu `.env.example` thành `.env`:
```bash
cp .env.example .env
```
Mở tệp `.env` và điền khóa API của bạn (nếu có):
```env
# Khóa API Google Gemini (Tùy chọn nếu người dùng tự nhập khóa trên UI)
GEMINI_API_KEY="AIzaSy..."

# Đường dẫn URL của ứng dụng
APP_URL="http://localhost:3000"
```

> 💡 **Không còn giá trị nào bị gắn cứng vào mã nguồn.** Tên mô hình AI, cổng máy chủ,
> HMR và cấu hình Firebase đều đọc từ `.env` thông qua [src/config/appConfig.ts](src/config/appConfig.ts).
> Xem đầy đủ danh sách biến trong `.env.example`. Nếu bỏ trống, ứng dụng dùng giá trị mặc định
> như cũ nên vẫn chạy được ngay.

### 4. Chạy Ứng Dụng Ở Chế Độ Phát Triển (Development)
```bash
npm run dev
```
Mở trình duyệt và truy cập: **`http://localhost:3000`**

### 5. Đóng Gói Ứng Dụng (Production Build)
```bash
npm run build
```
Để chạy thử bản build hoàn chỉnh:
```bash
npm run start
```

---

## 📖 Hướng Dẫn Sử Dụng Chi Tiết

### 1. Tùy Chọn Cấp Độ Trả Lời & Chế Độ Siêu Tốc
- Trên thanh nhập tin nhắn, nhấp vào một trong ba nút cấp độ:
  - **⚡ Ngắn gọn**: Thích hợp để tra cứu nhanh, nhận câu trả lời ngắn gọn, thẳng vào vấn đề, không rườm rà.
  - **⚖️ Tiêu chuẩn**: Trả lời cân bằng giữa độ dài và phân tích.
  - **📚 Chi tiết**: Phân tích toàn diện khi nghiên cứu học thuật hoặc đọc ca bệnh.
- Bấm nút **⚡ Siêu tốc** để kích hoạt chế độ phản hồi tức thời, loại bỏ thời gian tính toán chuỗi suy nghĩ dài.

### 2. Tải & Phân Tích Đa Tài Liệu
- Bấm biểu tượng 📎 (Kẹp giấy) hoặc **kéo thả trực tiếp** tệp vào khung chat.
- Hỗ trợ cùng lúc nhiều tệp:
  - Đính kèm file Excel để yêu cầu: *"Phân tích doanh thu và tóm tắt xu hướng theo quý từ bảng tính này."*
  - Đính kèm file Word/PDF luận văn để yêu cầu: *"Tóm tắt 5 luận điểm chính trong tài liệu."*
  - Đính kèm bài thuyết trình PowerPoint để yêu cầu: *"Tạo câu hỏi trắc nghiệm kiểm tra kiến thức dựa trên các slide đính kèm."*

### 3. Không Gian Y Khoa Dành Cho Sinh Viên & Bác Sĩ
- Nhấn vào biểu tượng **🩺 Ôn thi & Y khoa** trên thanh công cụ hoặc menu bên dưới:
  - **Trắc nghiệm Y khoa**: Chọn chuyên khoa (Nội, Ngoại, Sản, Nhi, Dược lý, Giải phẫu...) và tạo bộ câu hỏi thi thử theo phong cách đề thi quốc gia hoặc USMLE.
  - **Phân tích ca lâm sàng**: Đưa vào triệu chứng, tiền sử và để AI đóng vai trò người hướng dẫn Socratic đặt câu hỏi chẩn đoán và chỉ định cận lâm sàng.
  - **Máy tính điểm lâm sàng**: Nhập nhanh các chỉ số để tính tự động GCS, CURB-65, Alvarado, CHA2DS2-VASc, qSOFA với các khuyến cáo xử trí chuẩn mực.

### 4. Quản Lý 100+ Dịch Vụ API Key & Mã Hóa An Toàn
- Nhấn vào biểu tượng **🔑 Khóa API** trên thanh điều hướng.
- Tra cứu danh mục hơn 100+ dịch vụ AI (Google Gemini, OpenAI, Anthropic Claude, Groq, DeepSeek, OpenRouter, Mistral, Ollama, ElevenLabs, HuggingFace...).
- Thêm dịch vụ của bạn bằng cách nhập **Base URL** và **API Key**:
  - Nhấn **⚡ Lấy model tự động** để hệ thống quét các mô hình đang hoạt động trên máy chủ đó.
  - Nhấn **Kiểm tra (Test PING)** để đo lường thời gian phản hồi (latency).
- Nhấn **Sao lưu khóa (.json)** để tải bản sao lưu đã mã hóa về máy tính khi chuyển đổi thiết bị.

### 5. Xuất Cuộc Trò Chuyện & Đồng Bộ Đám Mây
- Nhấn **Tải về** ở góc trên bên phải để mở hộp thoại xuất file:
  - Chọn định dạng: **PDF**, **Word**, **Excel**, **PowerPoint** hoặc **Markdown**.
- Nhấn **Google Workspace** để đưa trực tiếp cuộc hội thoại vào Google Docs hoặc Google Sheets của tài khoản Google đã đăng nhập.

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng

Dự án áp dụng quy chuẩn kiểm thử nghiêm ngặt đối với toàn bộ các module xử lý logic thuần (Pure Logic Functions) bằng Native Test Runner của Node.js:

```bash
npm test
```

### Các Module Được Kiểm Thử Tự Động:
- ✅ **Mã hóa & Giải mã AES-GCM**: Đảm bảo chu trình encrypt/decrypt tính toàn vẹn dữ liệu.
- ✅ **Sao lưu & Kiểm tra tính hợp lệ JSON**: Ngăn chặn tải file sao lưu hỏng hoặc chứa mã độc.
- ✅ **Trích xuất tiêu đề hội thoại**: Giới hạn độ dài, xử lý ký tự đặc biệt.
- ✅ **Định dạng Markdown & Excel**: Xuất đầy đủ vai trò, thời gian, nội dung suy nghĩ và tệp đính kèm.
- ✅ **Công thức tính điểm lâm sàng Y học**: Kiểm thử tính chính xác của GCS, CURB-65, Alvarado, CHA2DS2-VASc, qSOFA theo tiêu chuẩn hiệp hội y khoa.
- ✅ **Xử lý kích thước tệp tin**: Kiểm thử hàm `formatFileSize` cho các mốc đơn vị B, KB, MB.

---

## 🚢 Triển Khai (Deployment)

### Triển Khai Lên Google Cloud Run
Dự án đã có cấu hình sẵn sàng cho Docker/Cloud Run với kịch bản:
```bash
npm run build
node server.ts
```

### Triển Khai Lên Vercel / Netlify
1. Kết nối repository GitHub với Vercel / Netlify.
2. Thiết lập `Build Command`: `npm run build`.
3. Thiết lập `Output Directory`: `dist`.
4. Thêm biến môi trường `GEMINI_API_KEY` trong mục Environment Variables của Dashboard.

---

## 🔒 Bảo Mật & Quyền Riêng Tư

1. **Khóa API của người dùng (Zero-Knowledge Storage)**:
   - Toàn bộ khóa API do người dùng nhập vào được mã hóa cục bộ thông qua `crypto.subtle` với thuật toán AES-GCM 256-bit trước khi lưu vào LocalStorage.
   - Khóa API **không bao giờ** được gửi về cơ sở dữ liệu Firestore hay máy chủ lưu trữ của ứng dụng.
2. **Quy tắc bảo mật Firestore (Role-Based Access Control)**:
   - Các phiên chat và tin nhắn được bảo vệ bằng quy tắc `firestore.rules`, chỉ chủ sở hữu tài khoản (`request.auth.uid == resource.data.userId`) mới có quyền đọc và ghi dữ liệu của chính mình.
3. **Quyền riêng tư tệp tài liệu**:
   - Quá trình phân tích tệp diễn ra trực tiếp trên trình duyệt và truyền qua luồng API an toàn của người dùng, không lưu trữ tệp tạm trên máy chủ trung gian.

---

## 📄 Giấy Phép

Dự án được phân phối dưới giấy phép **Apache License 2.0**. Xem chi tiết tại tệp `LICENSE` trong kho lưu trữ.

---

<p align="center">
  Phát triển với ❤️ vì trải nghiệm người dùng tối giản, tốc độ và phục vụ học tập Y khoa.
</p>
