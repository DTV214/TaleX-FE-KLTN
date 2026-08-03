"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, AlertCircle, Mail, CheckCircle2 } from "lucide-react";

import { resendOtpAction, verifyEmailAction } from "@/features/auth/api/auth.actions";
import { AuthErrorCode } from "@/features/auth/api/auth.dto";

type VerifyEmailResult = Awaited<ReturnType<typeof verifyEmailAction>>;
type VerifyEmailSuccessData = Extract<VerifyEmailResult, { success: true }>["data"];

type OtpVerificationStepProps = {
  verificationToken: string;
  /** Hiển thị "OTP đã gửi tới {email}" nếu có — luồng Google (VERIFYING) không có sẵn email lúc này. */
  email?: string;
  onSuccess: (data: VerifyEmailSuccessData) => void;
  onBack?: () => void;
};

/**
 * Bước nhập OTP dùng chung cho luồng đăng ký email/password (register-form.tsx) và
 * luồng Google login khi account đang ở trạng thái VERIFYING (đăng ký email trước,
 * chưa xác minh, sau đó login Google cùng email). Caller quyết định điều hướng sau
 * khi verify thành công (onSuccess), component không tự biết context gọi từ đâu.
 */
export function OtpVerificationStep({
  verificationToken,
  email,
  onSuccess,
  onBack,
}: OtpVerificationStepProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

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
        setErrorMsg("Phiên xác thực đã hết hạn. Vui lòng thử lại từ đầu.");
      } else {
        setErrorMsg(res.error?.message || "Xác thực thất bại.");
      }
      setIsLoading(false);
      return;
    }

    setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
    setTimeout(() => onSuccess(res.data), 1500);
  }

  async function handleResendOtp() {
    if (countdown > 0) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await resendOtpAction({ verificationToken });

    if (!res.success) {
      if (res.error?.data?.errorCode === AuthErrorCode.OTP_RATE_LIMITED) {
        setErrorMsg("Vui lòng đợi trước khi gửi yêu cầu mới.");
      } else {
        setErrorMsg("Không thể gửi lại mã. Vui lòng thử lại sau.");
      }
    } else {
      setSuccessMsg("Đã gửi lại mã OTP mới vào email của bạn.");
      setCountdown(60);
    }
    setIsLoading(false);
  }

  return (
    <div>
      {onBack && (
        <button
          onClick={onBack}
          type="button"
          className="mb-4 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}

      <div className="mb-8 text-center">
        <h1 className="text-lg sm:text-xl font-medium text-gray-200 tracking-wide">
          Xác Thực Email
        </h1>
        {email && (
          <p className="text-xs text-gray-400 mt-2">
            Mã OTP 6 số đã được gửi tới{" "}
            <span className="text-[#D4AF37] font-semibold">{email}</span>
          </p>
        )}
      </div>

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
          disabled={isLoading || !!successMsg}
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
    </div>
  );
}
