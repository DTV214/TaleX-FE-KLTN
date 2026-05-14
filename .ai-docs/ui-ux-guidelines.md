# Định hướng UI/UX & Typography (TaleX)

Tài liệu này quy định các tiêu chuẩn về giao diện, thị giác và phông chữ. Mọi code Frontend được sinh ra phải tuân thủ nghiêm ngặt các quy tắc này.

## 1. Typography (Phông chữ & Kích thước)
- **Font mặc định:** Inter (Hỗ trợ 100% tiếng Anh và tiếng Việt, subset: latin, vietnamese).
- **Base size:** 16px (1rem = 16px). Hạn chế sử dụng giá trị `px` cứng, luôn ưu tiên sử dụng hệ thống sizing của Tailwind (ví dụ: `text-sm`, `text-base`, `text-lg`).
- **Heading:** Các thẻ tiêu đề (h1-h6) phải có font-weight từ `semibold` đến `extrabold` để tạo sự phân cấp rõ ràng.

## 2. Ngôn ngữ thiết kế (Design Language)
- Ứng dụng phong cách thiết kế hiện đại với hiệu ứng **Glass-morphism** (kính trong suốt) kết hợp **high-contrast cinematic lighting** (ánh sáng điện ảnh độ tương phản cao).
- Sử dụng **gradient color schemes** (dải màu chuyển sắc) một cách tinh tế cho các thành phần nổi bật như Application Headers, Landing Pages, và các nút Call-to-Action.
- Tái sử dụng class tiện ích `.glass-panel` đã được định nghĩa sẵn trong `globals.css` cho các thẻ container nổi trên nền background thay vì tự viết lại các thuộc tính blur/opacity.

## 3. Giao diện xem Video (Player & Theme)
- Ưu tiên hiển thị giao diện Dark Mode làm chuẩn (default) để tối ưu hóa trải nghiệm xem video và làm nổi bật màu sắc của truyện tranh/hoạt hình.
- Đảm bảo độ tương phản văn bản (Text Contrast) luôn đạt chuẩn Accessibility, đặc biệt là phụ đề và nội dung chữ hiển thị đè lên video.
