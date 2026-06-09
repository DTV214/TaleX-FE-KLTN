"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  CheckCircle2,
} from "lucide-react";
import {
  registerAction,
  verifyEmailAction,
  resendOtpAction,
} from "@/features/auth/api/auth.actions";
import { AuthErrorCode } from "@/features/auth/api/auth.dto";

export function RegisterForm() {
  const router = useRouter();

  // States quản lý luồng 2 bước
  const [step, setStep] = useState<1 | 2>(1);
  const [verificationToken, setVerificationToken] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  // States UI
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State đếm ngược gửi lại OTP
  const [countdown, setCountdown] = useState(60);

  // Hook đếm ngược cho OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 2 && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

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
    setCountdown(60); // Reset bộ đếm 60s
    setIsLoading(false);
  }

  // ==========================================
  // XỬ LÝ BƯỚC 2: XÁC THỰC OTP
  // ==========================================
  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const otpCode = formData.get("otpCode") as string;

    const res = await verifyEmailAction({ verificationToken, otpCode });

    if (!res.success) {
      const errorCode = res.error?.data?.errorCode;
      if (errorCode === AuthErrorCode.INVALID_OTP) {
        setErrorMsg("Mã OTP không chính xác.");
      } else if (errorCode === AuthErrorCode.INVALID_VERIFICATION_TOKEN) {
        setErrorMsg("Phiên xác thực đã hết hạn. Vui lòng đăng ký lại.");
      } else {
        setErrorMsg(res.error?.message || "Xác thực thất bại.");
      }
      setIsLoading(false);
      return;
    }

    // Đăng ký và xác thực thành công tuyệt đối!
    setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1500);
  }

  // ==========================================
  // XỬ LÝ: GỬI LẠI MÃ OTP
  // ==========================================
  async function handleResendOtp() {
    if (countdown > 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await resendOtpAction({ verificationToken });

    if (!res.success) {
      if (res.error?.data?.errorCode === AuthErrorCode.OTP_COOLDOWN) {
        setErrorMsg("Vui lòng đợi trước khi gửi yêu cầu mới.");
      } else {
        setErrorMsg("Không thể gửi lại mã. Vui lòng thử lại sau.");
      }
    } else {
      setSuccessMsg("Đã gửi lại mã OTP mới vào email của bạn.");
      setCountdown(60); // Reset countdown
    }
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

      <div className="mb-8 text-center mt-2">
        <h1 className="text-lg sm:text-xl font-medium text-gray-200 tracking-wide">
          {step === 1 ? "Tạo Tài Khoản Mới" : "Xác Thực Email"}
        </h1>
        {step === 2 && (
          <p className="text-xs text-gray-400 mt-2">
            Mã OTP 6 số đã được gửi tới{" "}
            <span className="text-[#D4AF37] font-semibold">{userEmail}</span>
          </p>
        )}
      </div>

      {/* Cảnh báo lỗi & Thành công */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#10B981]">{successMsg}</p>
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

      {/* ================= BƯỚC 2: FORM NHẬP OTP ================= */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium flex items-center justify-between">
              <span>Mã OTP (6 chữ số)</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className="text-[#D4AF37] hover:text-[#E5C158] transition-colors disabled:text-gray-600 disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
              </button>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                name="otpCode"
                required
                maxLength={6}
                placeholder="Ví dụ: 123456"
                className="w-full text-center tracking-[0.5em] text-lg font-bold rounded-xl border border-white/10 bg-[#121214] p-3.5 text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#D4AF37] py-3.5 text-sm font-bold text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all hover:bg-[#E5C158] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] active:scale-[0.98] tracking-widest uppercase disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang kiểm tra...
              </>
            ) : (
              "Xác Thực Email"
            )}
          </button>
        </form>
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
