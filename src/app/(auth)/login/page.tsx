import { LoginForm } from "@/features/auth/components/login-form";
import { Metadata } from "next";

// Cấu hình thẻ meta (Tiêu đề tab trình duyệt) cho chuẩn SEO
export const metadata: Metadata = {
  title: "Đăng nhập | TaleX",
  description:
    "Đăng nhập vào tài khoản TaleX của bạn để trải nghiệm thế giới giải trí.",
};

export default function LoginPage() {
  return (
    // Thêm wrapper giới hạn độ rộng để form không bị kéo giãn quá to trên màn hình lớn
    <div className="w-full max-w-md mx-auto">
      <LoginForm />
    </div>
  );
}
