# TaleX - Frontend App (Next.js) 🚀

TaleX là nền tảng phát triển video truyện tranh và hoạt hình ngắn. Repository này chứa toàn bộ mã nguồn Frontend dành cho Web Client của dự án.

## 🛠 Tech Stack

- **Framework:** Next.js (App Router)
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS + UI components từ [Shadcn UI](https://ui.shadcn.com/)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Icons:** Lucide React

## 📂 Kiến trúc thư mục: Feature-Sliced Design (FSD)

Dự án áp dụng FSD để giảm thiểu conflict code và dễ bảo trì. Mọi người chú ý tuân thủ cấu trúc sau:

- `src/app/`: CHỈ chứa định tuyến (pages, layouts). Không viết logic phức tạp ở đây.
- `src/features/`: Chứa 80% code dự án, chia theo tính năng (VD: `video-player`, `monetization`). 
  - Mỗi feature sẽ tự quản lý `components`, `hooks`, `api` của riêng nó.
- `src/shared/`: Các UI dùng chung (Button, Input), helper functions, cấu hình libs.
- `src/core/`: Xử lý lõi hệ thống (Auth, Zustand Store).

⚠️ **Quy tắc quan trọng:** Không import chéo các file nằm sâu bên trong giữa các thư mục `features`.

## 🚀 Hướng dẫn cài đặt (Local Development)

1. Clone repository về máy.
2. Chạy lệnh cài đặt các gói phụ thuộc:
   ```bash
   npm install
