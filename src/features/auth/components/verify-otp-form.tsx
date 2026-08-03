"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

import { OtpVerificationStep } from "@/features/auth/components/otp-verification-step";
import { useAuthStore } from "@/features/auth/store/auth.store";

/**
 * Trang nhập OTP cho Google login khi account đang ở trạng thái VERIFYING (đăng ký
 * email/password trước, chưa xác minh, sau đó login Google cùng email — BE link
 * Google vào account, gửi lại OTP, trả về verificationToken cho luồng này).
 */
export function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationToken = searchParams.get("token") || "";
  const { setUser } = useAuthStore();

  if (!verificationToken) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
        <AlertCircle className="w-12 h-12 text-[#E50914] mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-200 mb-2">Thiếu thông tin xác minh</h2>
        <p className="text-sm text-gray-400 mb-6">
          Vui lòng đăng nhập bằng Google để bắt đầu quá trình xác thực.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="rounded-lg bg-[#D4AF37] px-6 py-3 text-sm font-bold text-black hover:bg-[#E5C158] transition-all"
        >
          Về trang đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
      <OtpVerificationStep
        verificationToken={verificationToken}
        onBack={() => router.push("/login")}
        onSuccess={(data) => {
          if (data.user) {
            setUser(data.user);
          }
          router.replace("/");
          router.refresh();
        }}
      />
    </div>
  );
}
