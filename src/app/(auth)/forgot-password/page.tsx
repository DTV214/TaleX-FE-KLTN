import { Metadata } from "next";
import { ForgotPasswordContainer } from "@/features/auth/components/forgot-password-container";

export const metadata: Metadata = {
  title: "Quên mật khẩu | TaleX",
  description: "Khôi phục quyền truy cập tài khoản TaleX của bạn.",
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <ForgotPasswordContainer />
    </div>
  );
}
