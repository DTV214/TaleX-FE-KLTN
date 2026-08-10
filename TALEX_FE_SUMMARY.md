# TỔNG HỢP KIẾN TRÚC, GIAO DIỆN, STATE, API & TÍNH NĂNG SOURCE FE (TaleX-FE-KLTN)

---

## 1. TỔNG QUAN CÔNG NGHỆ (TECH STACK)

* **Core Framework**: [Next.js](file:///d:/DoAnTotNghiep/SourceFE-Moi2/TaleX-FE-KLTN/package.json#L27) (App Router, Server & Client Components), React 19, TypeScript
* **Styling & UI**: Tailwind CSS v4, Framer Motion (Hiệu ứng mượt mà), Radix UI primitives, Shadcn UI components, Lucide Icons
* **Quản Lý Trạng Thái (State Management)**:
  * **Global UI State**: Zustand (`src/shared/stores/public-sidebar.store.ts`)
  * **Server State & Caching**: TanStack React Query v5 (`@tanstack/react-query`)
* **Truyền Tải & Trình Chiếu Media**:
  * **Video Streaming**: HLS.js (`hls.js`) hỗ trợ phát video HLS mượt mà & DRM Signed URL.
  * **Comic Reader**: Trình đọc truyện tranh tối ưu hóa theo chiều dọc/ngang.
  * **Real-time Pipeline**: `@microsoft/fetch-event-source` (Server-Sent Events - SSE) cho tiến trình xử lý video/truyện.
* **Form & Validation**: React Hook Form, Zod (`@hookform/resolvers`)
* **Thống Kê & Báo Cáo**: Recharts (Biểu đồ), XLSX (Xuất báo cáo Excel)
* **Testing & Mocks**: Vitest, React Testing Library, MSW (Mock Service Worker)

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```text
d:\DoAnTotNghiep\SourceFE-Moi2\TaleX-FE-KLTN\
├── src/
│   ├── app/                  # Next.js App Router (Các tuyến đường, trang & API internal routes)
│   ├── core/                 # Cấu hình cốt lõi & các Context Providers (QueryClient, Auth, v.v.)
│   ├── features/             # Kiến trúc Feature-Driven (Mỗi tính năng độc lập gồm Components, Hooks, API, Types)
│   ├── shared/               # UI Primitives, Shared Components (Header, Footer, Layout Shell), HTTP Client, Utils, Stores
│   ├── mocks/                # MSW Handlers cho Unit/Integration Tests
│   └── proxy.ts              # Proxy cấu hình chuyển tiếp request
├── public/                   # Tài nguyên tĩnh (Logo, Banner, Icons)
├── package.json              # Khai báo phụ thuộc & npm scripts
└── vitest.config.ts          # Cấu hình Testing
```

---

## 3. BẢNG TỔNG HỢP CÁC TRANG GIAO DIỆN (PAGES & UI ROUTES)

### 3.1. Phân Hệ Xác Thực (Auth Routes - `src/app/(auth)`)
* `/login`: Đăng nhập hệ thống (Email/Password, OAuth/SSO).
* `/register`: Đăng ký tài khoản người dùng mới.
* `/forgot-password`: Quên mật khẩu & gửi link/OTP khôi phục.
* `/verify-otp`: Xác thực mã OTP 6 chữ số.
* `/complete-profile`: Bổ sung thông tin cá nhân cho tài khoản mới.

### 3.2. Phân Hệ Khán Giả / User Consumption (`src/app/`)
* `/`: **Trang chủ (Home Feed)** - Banner chính, Top 10 trong ngày, phim/truyện đề xuất, danh mục nổi bật.
* `/intro`: Trang giới thiệu nền tảng (Landing Page), giới thiệu tác giả & series nổi bật.
* `/series` & `/series/[seriesId]`: Trang danh sách & chi tiết phim/truyện, thông tin tác giả, danh sách tập, đánh giá & bình luận.
* `/comics`: Khám phá kho truyện tranh.
* `/watch/[episodeId]`: **Trình xem Video HLS** tích hợp phát hiện xem tiếp, điểm danh heartbeat, mở khóa tập.
* `/read/[episodeId]`: **Trình đọc Truyện Tranh Canvas/Vertical** với điểm danh heartbeat.
* `/search`: Tìm kiếm nâng cao với bộ lọc thể loại, trạng thái, sắp xếp.
* `/bookmarks`: Khung lưu trữ phim/truyện đã đánh dấu.
* `/history`: Lịch sử đã xem/đọc.
* `/liked`: Danh sách phim/truyện đã yêu thích.
* `/subscriptions`: Danh sách các tác giả/kênh người dùng đang theo dõi.
* `/my-ratings`: Lịch sử các đánh giá sao của người dùng.
* `/missions`: **Trung tâm Nhiệm vụ & Điểm danh hàng ngày** (Daily Check-in streak, xem video nhận xu, xem quảng cáo).
* `/coin-history`: Lịch sử giao dịch Xu (Thu thập & Tiêu dùng).
* `/purchase-history` & `/premium-history`: Lịch sử mua tập lẻ/combo & lịch sử đăng ký gói Premium.
* `/premium`: Trang đăng ký các gói thành viên Premium.
* `/checkout`, `/checkout-content`, `/checkout-engagement`: Trang thanh toán đơn hàng (Mua xu, mua nội dung, mua gói tăng tương tác).
* `/profile`: Quản lý hồ sơ cá nhân, cài đặt tài khoản.
* `/public-channel` / `/creator-channel`: Trang hồ sơ công khai của Creator.
* `/onboarding`: Trang chọn sở thích ban đầu cho người dùng mới.

### 3.3. Phân Hệ Tác Giả (Creator Dashboard - `src/app/creator-dashboard`)
* `/creator-dashboard`: Tổng quan chỉ số Tác giả (Views, Xu nhận được, Đánh giá, Thống kê).
* **Quản lý Nội dung**: Danh sách Series, Quản lý Mùa (Seasons), Quản lý Tập (Episodes).
* **Tải lên Nội dung**:
  * Tải lên Video (Hỗ trợ **Resumable S3 Direct Upload** với chunking, thanh tiến trình).
  * Tải lên Truyện tranh (Upload danh sách trang truyện).
* **SSE Pipeline Monitor**: Theo dõi tiến trình tự động mã hóa video HLS/AI moderation theo thời gian thực.
* **Gói Monetization & Combo**: Thiết lập giá bán tập lẻ, tạo gói Combo giảm giá.
* **Tăng Tương Tác (Creator Campaigns)**: Mua các gói Boost lượt xem/đề xuất cho Series.

### 3.4. Phân Hệ Quản Trị Viên (Admin Dashboard - `src/app/admin`)
* `/admin/dashboard`: Báo cáo tổng quan toàn nền tảng.
* `/admin/users` & `/admin/creators`: Quản lý tài khoản người dùng & Creator.
* `/admin/creator-verification` & `/admin/creator-tiers`: Phê duyệt tác giả mới & Cấu hình phân cấp Creator.
* `/admin/moderation`: Duyệt nội dung tự động/thủ công (Video & Truyện tranh).
* `/admin/series` & `/admin/comics`: Quản lý danh mục nội dung trên toàn hệ thống.
* `/admin/categories` & `/admin/tags`: Quản lý thể loại & nhãn nội dung.
* `/admin/coin-management`: Cấu hình nền kinh tế Xu (Tỷ lệ thưởng, mốc điểm danh).
* `/admin/mission-management`: Quản lý danh sách nhiệm vụ & phần thưởng.
* `/admin/campaigns` & `/admin/ads`: Quản lý chiến dịch quảng cáo & vị trí quảng cáo.
* `/admin/financials`: Thống kê doanh thu, dòng tiền, thanh toán tác giả.
* `/admin/settings` & `/admin/settings/media-config-tab`: Cấu hình máy chủ Media & Storage S3.
* `/admin/terms`: Quản lý các phiên bản Điều khoản dịch vụ & Chính sách.

### 3.5. Phân Hệ Nhân Viên Kiểm Duyệt (Staff Dashboard - `src/app/staff`)
* `/staff/dashboard`: Báo cáo công việc kiểm duyệt.
* `/staff/applications`: Phê duyệt đơn đăng ký trở thành Creator.
* `/staff/moderation`: Hàng chờ kiểm duyệt video/truyện tranh vi phạm tiêu chuẩn cộng đồng.
* `/staff/reports`: Quản lý & xử lý các báo cáo vi phạm từ người dùng.

### 3.6. Phân Hệ Nhà Quảng Cáo (Advertiser - `src/app/advertiser-dashboard` & `/ads`)
* `/advertiser-dashboard`: Quản lý các chiến dịch quảng cáo hiển thị trên nền tảng.

---

## 4. QUẢN LÝ TRẠNG THÁI (STATE MANAGEMENT & HOOKS)

### 4.1. Global UI Store (Zustand)
* `src/shared/stores/public-sidebar.store.ts`: Quản lý trạng thái ẩn/hiện thanh điều hướng Side Navigation.

### 4.2. Custom Hooks & Server State Management (React Query / React Hooks)
| Phân hệ / Domain | Custom Hooks tiêu biểu | Chức năng chính |
| :--- | :--- | :--- |
| **Home & Recommendations** | `use-home-feed.ts` | Feching danh sách nội dung trang chủ, danh mục & đề xuất |
| **Content & Series** | `use-series-ratings.ts`<br>`use-episode-likes.ts`<br>`use-episode-bookmarks.ts`<br>`use-episode-shares.ts`<br>`use-creator-follow.ts` | Xử lý đánh giá sao, thả tim tập, lưu bookmark, chia sẻ tập, và nhấn Theo dõi Creator |
| **Playback & Session** | `useHeartbeat.ts`<br>`useComicHeartbeat.ts` | Gửi định kỳ heartbeat để ghi nhận thời lượng xem/đọc & tích lũy nhiệm vụ |
| **Coin Economy** | `useCoinQueries.ts`<br>`useCoinMutations.ts` | Lấy số dư ví, điểm danh daily check-in, lịch sử giao dịch Xu |
| **Missions System** | `useMissionQueries.ts`<br>`useMissionMutations.ts`<br>`useMissionHeartbeat.ts` | Lấy danh sách nhiệm vụ, nhận thưởng nhiệm vụ, theo dõi tiến độ |
| **Comments System** | `use-comments.ts` | Phân trang bình luận, gửi bình luận mới, trả lời comment, thả tim comment |
| **Creator Dashboard** | `use-resumable-video-upload.ts`<br>`use-pipeline-sse.ts`<br>`use-creator-campaigns.ts` | Upload video lớn phân đoạn S3, kết nối SSE nhận sự kiện transcode, mua gói Boost |
| **Moderation (Staff/Admin)**| `use-moderation-queries.ts`<br>`use-moderation-mutations.ts` | Lấy danh sách chờ duyệt, thực hiện Approve/Reject kèm lý do |
| **Notifications** | `use-notifications.ts` | Nhận & hiển thị thông báo đẩy cho người dùng |

---

## 5. TẦNG API & SERVICE (API LAYER)

### 5.1. Core Http Client (`src/shared/api/http-client.ts`)
* Tích hợp **Axios Client** cấu hình sẵn `baseURL`, tự động đính kèm `Bearer Token`.
* Cơ chế **Auto Refresh Token** khi gặp lỗi HTTP 401 Unauthorized.
* Chuẩn hóa xử lý lỗi hệ thống & định dạng dữ liệu trả về từ Backend (`ApiResponse<T>`).

### 5.2. Danh Sách API Services Trong Features (`src/features/*/api`)
1. **`auth/api`**: API đăng nhập, đăng ký, quên mật khẩu, xác thực OTP, làm mới token.
2. **`series/api`**:
   * `series-api.ts`: API lấy thông tin Series, danh sách Mùa & Tập.
   * `series-ratings-api.ts`: Gửi đánh giá sao & lấy trung bình đánh giá.
   * `episode-likes-api.ts`: Thả tim tập & lấy danh sách người thích.
   * `episode-bookmarks-api.ts`: Thêm/xóa lưu tập truyện/phim.
   * `episode-shares-api.ts`: Ghi nhận lượt chia sẻ tập.
   * `creator-follows-api.ts`: Follow/Unfollow kênh Creator.
3. **`playback/api`**:
   * `playback-api.ts`: Lấy URL phát Video (Signed HLS URL), xác thực quyền truy cập tập.
   * `watch-sessions-api.ts`: Ghi nhận Session xem video & thời lượng tiến trình.
4. **`comments/api`**: `comments-api.ts` - CRUD bình luận, phân trang & tương tác comment.
5. **`coin/api`**: `coin.api.ts` - Ví xu, điểm danh liên tục (Streak Multiplier), lịch sử biến động xu.
6. **`mission/api`**: `mission.api.ts` - Danh sách nhiệm vụ hàng ngày/tuần, nhận thưởng xu/quà, xem quảng cáo đổi xu.
7. **`payment/api` & `checkout/api`**: `payment.api.ts` - Tích hợp cổng thanh toán (VNPay/PayOS), tạo giao dịch mua xu, mua gói nội dung.
8. **`premium/api`**: `premium.api.ts` - Kiểm tra trạng thái VIP Premium & mua các gói hội viên.
9. **`creator-dashboard/api`**:
   * `creator-content-api.ts`: Tạo/sửa/xóa Series, Season, Episode.
   * `video-upload-api.ts` & `s3-upload-api.ts`: Xin presigned URL & upload file trực tiếp lên AWS S3.
   * `cloudinary-api.ts`: Upload ảnh bìa/poster lên Cloudinary.
   * `pipeline-api.ts`: Theo dõi trạng thái encode HLS qua Server-Sent Events (SSE).
   * `creator-monetization-api.ts` & `combo.api.ts`: Cấu hình giá & tạo combo giảm giá.
   * `creator-campaigns.api.ts`: Đặt mua dịch vụ tăng tương tác (Boost).
10. **`staff/api`**: `staff-moderation-api.ts` - API duyệt bài, duyệt hồ sơ tác giả, xử lý báo cáo.
11. **`admin/api`**: API tổng hợp cho Admin (Quản lý User, Creator Tier, Tiêu chuẩn AI, Media Server Config).
12. **`notifications/api`**: `notifications-api.ts` - Đọc thông báo, đánh dấu đã đọc.
13. **`onboarding/api`**: `user-onboarding.api.ts` - Lưu sở thích ban đầu người dùng.

---

## 6. CHI TIẾT CÁC TÍNH NĂNG CHÍNH CỦA DỰ ÁN (CORE FEATURE MAP)

1. **Hệ Thống Trình Chiếu Media Đa Nền Tảng (Streaming & Reader)**:
   * Phát video định dạng **HLS (HTTP Live Streaming)** với tính năng tự động điều chỉnh chất lượng, ghi nhớ thời lượng dừng, signed URL bảo mật.
   * Trình đọc truyện tranh Canvas linh hoạt, hỗ trợ kéo thả, cuộn dọc mượt mà.
   * Phát hiện xem/đọc qua **Heartbeat Mechanism** phục vụ tích lũy thời gian nhận thưởng xu.
2. **Quy Trình Tác Giả & Pipeline Xử Lý Video (Creator Pipeline)**:
   * Đăng tải video dung lượng lớn qua **Resumable Chunked S3 Upload**.
   * Kết nối **SSE (Server-Sent Events)** hiển thị tiến trình Encode HLS, tạo Thumbnail, và quét bản quyền/chính sách AI theo thời gian thực.
   * Quản lý phân chia cấu trúc Series -> Season -> Episode chuyên nghiệp.
3. **Nền Kinh Tế Xu & Nhiệm Vụ (Coin Economy & Gamification)**:
   * **Daily Check-in**: Điểm danh nhận xu hàng ngày với cơ chế nhân điểm thưởng theo chuỗi ngày (Streak Multipliers).
   * **Mission Center**: Nhiệm vụ xem video tích lũy thời gian, nhiệm vụ đọc truyện, nhiệm vụ xem quảng cáo ngắn nhận thưởng.
   * **Ví Xu (Coin Wallet)**: Quản lý số dư, mở khóa tập lẻ bằng xu.
4. **Mô Hình Doanh Thu & Thanh Toán Đa Dạng (Monetization & Payment)**:
   * Thanh toán mở khóa từng tập lẻ hoặc mua trọn bộ qua gói Combo giảm giá.
   * Đăng ký gói thành viên VIP Premium xem không giới hạn.
   * Creator Boost Campaign: Tác giả có thể đầu tư gói quảng bá để đẩy Series lên khu vực nổi bật.
5. **Hệ Thống Kiểm Duyệt Nội Dung & Tuân Thủ (Content Moderation)**:
   * Kiểm duyệt tự động qua AI kết hợp với quy trình đánh giá 2 lớp của Staff/Admin.
   * Quản lý báo cáo vi phạm từ cộng đồng, Modal phản hồi lý do từ chối chi tiết cho tác giả.
6. **Cá Nhân Hóa & Tương Tác Xã Hội (Personalization & Social Interactions)**:
   * Đề xuất nội dung thông minh dựa trên lịch sử xem/đọc & danh mục yêu thích.
   * Hệ thống tương tác đầy đủ: Theo dõi Tác giả, Thả tim tập, Lưu Bookmark, Đánh giá sao, Bình luận phân cấp (Nested Comments).

---
*Báo cáo được tổng hợp tự động từ mã nguồn FE dự án TaleX.*
