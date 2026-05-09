# TaleX - Web Client 🚀

[cite_start]**TaleX** là nền tảng phát triển video truyện tranh và hoạt hình ngắn (A platform for short-video storytelling and digital comics)[cite: 14, 15]. [cite_start]Dự án được phát triển nhằm cung cấp không gian chuyên biệt cho cộng đồng người hâm mộ manga, manhwa và storytelling, đồng thời cung cấp công cụ tối ưu doanh thu cho nhà sáng tạo (Creator)[cite: 21, 22].

[cite_start]**Mã dự án:** SP26SE158 [cite: 16]

## 🛠 Công nghệ cốt lõi (Tech Stack)

[cite_start]Hệ thống Frontend được thiết kế để đảm bảo hiệu năng cao và giao diện người dùng trực quan[cite: 33]:
- [cite_start]**Framework:** Next.js (App Router) 
- **Ngôn ngữ:** TypeScript
- **Styling:** Tailwind CSS & Shadcn UI (Hướng tới phong cách Glass-morphism & Cinematic lighting)
- **State Management:** Zustand
- **Data Fetching & Caching:** TanStack Query (React Query)
- **Icons:** Lucide React

## 📂 Kiến trúc hệ thống: Feature-Sliced Design (FSD)

Dự án áp dụng kiến trúc FSD kết hợp tư tưởng Clean Architecture để chia tách logic, giảm thiểu conflict khi làm việc nhóm 5 người.

```text
src/
├── app/          # (Routing Layer) Định tuyến các trang (Viewer, Creator, Admin, Staff). Rất mỏng, không chứa logic.
├── features/     # (Business Layer) Chứa 80% code. Chia theo chức năng: video-player, monetization, moderation...
├── shared/       # (Shared Layer) UI components dùng chung (Shadcn), helper functions, cấu hình libs.
└── core/         # (Core Layer) Xử lý Auth, Global Store, API Config.
⚠️ Quy tắc tối thượng: Không import chéo các file nội bộ giữa các thư mục trong features/.👥 Phân quyền hệ thống (Roles)Hệ thống hỗ trợ 4 nhóm người dùng chính:  Viewer: Xem video, tương tác, nạp Coin, mở khóa Fast Pass.  Creator: Quản lý nội dung, xem Dashboard phân tích, nhận chia sẻ doanh thu.  Staff: Kiểm duyệt nội dung, xử lý vi phạm DMCA.  Admin: Quản lý kinh tế hệ thống, cấu hình tỷ lệ doanh thu.  💻 Hướng dẫn phát triển (Local Development)1. Cài đặt môi trườngBashgit clone <repository_url>
cd talex-client
npm install
2. Biến môi trường (.env.local)
Tạo file .env.local từ .env.example và cập nhật các API endpoint kết nối tới server Spring Boot.  3. Khởi chạyBashnpm run dev
# Mở http://localhost:3000 để xem ứng dụng
