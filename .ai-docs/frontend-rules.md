# TaleX Frontend Coding Guidelines

Tài liệu này định nghĩa các quy tắc bắt buộc khi tạo, chỉnh sửa mã nguồn cho Web Client của dự án TaleX. Trợ lý AI khi sinh code phải tuân thủ nghiêm ngặt các quy tắc này để đảm bảo team 5 người không bị conflict.

## 1. Kiến trúc (Feature-Sliced Design - FSD)
- Tuyệt đối không viết Business Logic (gọi API, xử lý state phức tạp) trong thư mục `src/app/`. Thư mục này chỉ dùng để định tuyến (Routing của Next.js).
- Logic tính năng phải đóng gói trong `src/features/[tên-tính-năng]/`.
- Cấu trúc một Feature luôn bao gồm:
  - `components/`: UI nội bộ của tính năng.
  - `hooks/`: Custom hooks chứa logic.
  - `api/`: API calls (Axios).
  - `index.ts`: Public API, xuất (export) những thành phần cho phép bên ngoài dùng.
- CẤM import chéo các file nằm sâu bên trong giữa các feature. Phải import qua file `index.ts`.

## 2. Công nghệ & Styling
- 100% TypeScript. Khai báo Interface/Type rõ ràng.
- Giao diện hướng tới phong cách Glass-morphism & Cinematic lighting. Ưu tiên dùng utility classes của Tailwind CSS.
- Component cơ bản dùng Shadcn UI tại `src/shared/ui`. Không tự viết CSS thuần nếu Tailwind xử lý được.
- Quản lý state cục bộ bằng hook, state toàn cục bằng Zustand, Data Fetching bằng React Query.
