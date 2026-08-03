"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { registerAction } from "@/features/auth/api/auth.actions";
import { AuthErrorCode } from "@/features/auth/api/auth.dto";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { OtpVerificationStep } from "@/features/auth/components/otp-verification-step";

export function RegisterForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  // States quản lý luồng 2 bước
  const [step, setStep] = useState<1 | 2>(1);
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // States UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ==========================================
  // XỬ LÝ BƯỚC 1: ĐĂNG KÝ THÔNG TIN
  // ==========================================
  async function handleRegisterInfo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp!");
      setIsLoading(false);
      return;
    }

    const data = {
      username: formData.get("username") as string,
      email: email,
      password: password,
      fullName: formData.get("fullName") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
      phone: formData.get("phone") as string,
    };

    const res = await registerAction(data);

    if (!res.success) {
      const errorCode = res.error?.data?.errorCode;
      if (errorCode === AuthErrorCode.EMAIL_ALREADY_EXISTS) {
        setErrorMsg("Email này đã được sử dụng.");
      } else if (errorCode === AuthErrorCode.USERNAME_ALREADY_EXISTS) {
        setErrorMsg("Tên đăng nhập (Username) đã tồn tại.");
      } else {
        setErrorMsg(
          res.error?.message ||
            "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.",
        );
      }
      setIsLoading(false);
      return;
    }

    // Thành công bước 1 -> Lưu token tạm & Chuyển sang bước 2
    setVerificationToken(res.data);
    setUserEmail(email);
    setStep(2);
    setIsLoading(false);
  }

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      {/* Nút Back về Login hoặc Quay lại Bước 1 */}
      {step === 1 ? (
        <Link
          href="/login"
          className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      ) : (
        <button
          onClick={() => setStep(1)}
          className="absolute top-8 left-8 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      {step === 1 && (
        <div className="mb-8 text-center mt-2">
          <h1 className="text-lg sm:text-xl font-medium text-gray-200 tracking-wide">
            Tạo Tài Khoản Mới
          </h1>
        </div>
      )}

      {/* Cảnh báo lỗi (chỉ dùng cho bước 1 — OtpVerificationStep tự render lỗi/thành công riêng) */}
      {step === 1 && errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}

      {/* ================= BƯỚC 1: FORM THÔNG TIN ================= */}
      {step === 1 && (
        <form onSubmit={handleRegisterInfo} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">
                Họ và Tên
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Nguyễn Văn A"
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                placeholder="nguyenvana123"
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              placeholder="email@example.com"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">
                Ngày sinh
              </label>
              <input
                type="date"
                name="dateOfBirth"
                required
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all [color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone"
                required
                placeholder="0901234567"
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <label className="text-xs text-gray-400 font-medium">
              Mật khẩu (Tối thiểu 8 ký tự)
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pr-11 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Xác nhận Mật khẩu
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              required
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pr-11 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full rounded-lg bg-[#E50914] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#ff0a16] hover:shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-[0.98] tracking-widest uppercase disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...
              </>
            ) : (
              "Tiếp tục"
            )}
          </button>
        </form>
      )}

      {/* ================= BƯỚC 2: XÁC THỰC OTP ================= */}
      {step === 2 && (
        <OtpVerificationStep
          verificationToken={verificationToken}
          email={userEmail}
          onSuccess={(data) => {
            if (data.user) {
              setUser(data.user);
            }
            router.push("/");
            router.refresh();
          }}
        />
      )}

      {/* Footer chung */}
      {step === 1 && (
        <p className="mt-8 text-center text-xs sm:text-sm text-gray-400">
          Đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
          >
            Đăng nhập
          </Link>
        </p>
      )}
    </div>
  );
}
