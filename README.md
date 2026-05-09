# TaleX - Frontend Web Client

TaleX là nền tảng phát triển video truyện tranh và hoạt hình ngắn. Repository này chứa mã nguồn Frontend cho Web Client của TaleX, được xây dựng trên Next.js, TypeScript và Tailwind CSS.

## Tổng quan dự án

TaleX hướng đến trải nghiệm nội dung số dành cho nhiều nhóm người dùng:

- **Viewer:** xem video, tương tác với nội dung, nạp Coin và mở khóa nội dung.
- **Creator:** quản lý series, theo dõi hiệu suất nội dung và doanh thu.
- **Staff:** kiểm duyệt nội dung, xử lý báo cáo và hỗ trợ vận hành.
- **Admin:** quản lý hệ thống, người dùng, cấu hình kinh tế và các nghiệp vụ nền tảng.

Frontend được thiết kế theo hướng dễ mở rộng, dễ bảo trì và hạn chế conflict khi nhiều thành viên cùng phát triển tính năng.

## Công nghệ sử dụng

- **Framework:** Next.js App Router
- **Ngôn ngữ:** TypeScript
- **UI:** React, Tailwind CSS, Shadcn UI style components
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Icons:** Lucide React
- **Code Quality:** ESLint

## Cấu trúc thư mục

Dự án định hướng theo Feature-Sliced Design để tách biệt trách nhiệm giữa routing, logic tính năng và tài nguyên dùng chung.

```text
src/
├── app/          # Routing, layouts và page entry points của Next.js
├── features/     # Logic theo từng tính năng: components, hooks, api
├── shared/       # UI dùng chung, helper functions và cấu hình thư viện
└── core/         # Logic lõi của ứng dụng như auth, store, providers
```

### Quy ước quan trọng

- Không đặt business logic phức tạp trực tiếp trong `src/app/`.
- Mỗi tính năng nên được đóng gói trong `src/features/[feature-name]/`.
- Không import chéo sâu giữa các feature. Nếu một feature cần public API, hãy export qua `index.ts`.
- Component dùng chung nên đặt tại `src/shared/`.
- Ưu tiên TypeScript rõ ràng, đặt tên biến/hàm có ý nghĩa và dễ đọc.

## Cài đặt môi trường

Yêu cầu:

- Node.js phiên bản phù hợp với Next.js 16
- npm

Cài đặt dependencies:

```bash
npm install
```

Chạy môi trường phát triển:

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run dev` | Khởi chạy môi trường development |
| `npm run build` | Build ứng dụng cho production |
| `npm run start` | Chạy ứng dụng sau khi build |
| `npm run lint` | Kiểm tra chất lượng mã nguồn bằng ESLint |

## Quy trình phát triển đề xuất

1. Cập nhật code mới nhất từ remote:

   ```bash
   git pull
   ```

2. Tạo hoặc checkout sang branch làm việc:

   ```bash
   git checkout -b feature/ten-tinh-nang
   ```

3. Kiểm tra lint trước khi commit:

   ```bash
   npm run lint
   ```

4. Commit với nội dung rõ ràng:

   ```bash
   git add .
   git commit -m "feat: mo ta ngan gon thay doi"
   ```

5. Push branch lên remote:

   ```bash
   git push origin feature/ten-tinh-nang
   ```

## Ghi chú cho thành viên dự án

- Luôn đọc tài liệu nội bộ trong `.ai-docs/` trước khi phát triển tính năng mới.
- Giữ pull request nhỏ, tập trung vào một nhóm thay đổi cụ thể.
- Không tự ý thay đổi cấu trúc nền tảng nếu chưa thống nhất với team.
- Khi gặp conflict, ưu tiên trao đổi trước khi ghi đè thay đổi của người khác.

## License

Repository này phục vụ cho dự án TaleX. Vui lòng không sao chép hoặc sử dụng lại mã nguồn ngoài phạm vi được cho phép bởi nhóm phát triển.
