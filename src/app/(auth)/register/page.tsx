import { RegisterForm } from "@/features/auth/components/register-form";
import { Metadata } from "next";

// Cấu hình thẻ meta (Tiêu đề tab trình duyệt) cho chuẩn SEO
export const metadata: Metadata = {
  title: "Đăng ký tài khoản | TaleX",
  description:
    "Tạo tài khoản TaleX mới để khám phá, theo dõi và chia sẻ những bộ truyện tranh, video giải trí độc quyền.",
};

export default function RegisterPage() {
  return (
    // Dùng max-w-2xl để form đăng ký (có chia 2 cột) được hiển thị thoáng mắt và đẹp nhất
    <div className="w-full max-w-2xl mx-auto">
      <RegisterForm />
    </div>
  );
}
