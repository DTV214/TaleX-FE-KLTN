"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { resetPasswordAction } from "../api/auth.actions";
import { AuthErrorCode } from "../api/auth.dto";

type ResetPasswordFormProps = {
  accountEmail: string;
  verificationToken: string;
  onBack: () => void;
};

function readFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getResetPasswordErrorMessage(errorCode?: AuthErrorCode, message?: string) {
  switch (errorCode) {
    case AuthErrorCode.INVALID_OTP:
      return "Mã OTP không chính xác.";
    case AuthErrorCode.OTP_RATE_LIMITED:
      return "Bạn thao tác quá nhanh. Vui lòng đợi trước khi thử lại.";
    case AuthErrorCode.INVALID_VERIFICATION_TOKEN:
      return "Phiên khôi phục đã hết hạn. Vui lòng quay lại bước nhập email.";
    case AuthErrorCode.PASSWORD_CONFIRMATION_MISMATCH:
      return "Mật khẩu xác nhận không khớp.";
    case AuthErrorCode.PASSWORD_SAME_AS_OLD:
      return "Mật khẩu mới không được trùng với mật khẩu cũ.";
    case AuthErrorCode.ACCOUNT_NOT_ACTIVE:
      return "Tài khoản chưa ở trạng thái hoạt động.";
    default:
      return message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
  }
}

export function ResetPasswordForm({
  accountEmail,
  verificationToken,
  onBack,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const otpCode = readFormValue(formData, "otpCode");
    const newPassword = readFormValue(formData, "newPassword");
    const confirmPassword = readFormValue(formData, "confirmPassword");

    if (!verificationToken) {
      setErrorMsg("Thiếu phiên khôi phục. Vui lòng quay lại bước nhập email.");
      setIsLoading(false);
      return;
    }

    if (!/^\d{6}$/.test(otpCode)) {
      setErrorMsg("OTP phải gồm đúng 6 chữ số.");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg("Mật khẩu mới phải có ít nhất 8 ký tự.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp.");
      setIsLoading(false);
      return;
    }

    const res = await resetPasswordAction({
      verificationToken,
      otpCode,
      newPassword,
      confirmPassword,
    });

    if (!res.success) {
      setErrorMsg(
        getResetPasswordErrorMessage(
          res.error?.data?.errorCode,
          res.error?.message,
        ),
      );
      setIsLoading(false);
      return;
    }

    setSuccessMsg("Mật khẩu đã được đặt lại. Đang chuyển về trang đăng nhập...");
    setIsLoading(false);
    window.setTimeout(() => {
      router.push("/login?passwordChanged=true");
    }, 1200);
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="absolute left-8 top-8 text-gray-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Back to email step"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>

      <div className="mb-8 pt-2 text-center">
        <h1 className="text-lg sm:text-xl font-medium tracking-wide text-gray-200">
          Đặt lại mật khẩu
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          Nhập OTP đã gửi tới email và tạo mật khẩu mới.
        </p>
      </div>

      {accountEmail && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[#121214] px-4 py-3">
          <Mail className="h-4 w-4 text-[#D4AF37]" />
          <p className="min-w-0 truncate text-sm font-medium text-gray-300">
            {accountEmail}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E50914]/20 bg-[#E50914]/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E50914]" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#10B981]/20 bg-[#10B981]/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#10B981]" />
          <p className="text-sm font-medium text-[#10B981]">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">
            Mã OTP
          </label>
          <input
            type="text"
            inputMode="numeric"
            name="otpCode"
            required
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-center text-lg font-bold tracking-[0.5em] text-white shadow-inner transition-all placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">
            Mật khẩu mới
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type={showNewPassword ? "text" : "password"}
              name="newPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Ít nhất 8 ký tự"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pl-11 pr-11 text-sm text-white shadow-inner transition-all placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#D4AF37]"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pl-11 pr-11 text-sm text-white shadow-inner transition-all placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((value) => !value)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#D4AF37]"
              aria-label={
                showConfirmPassword ? "Hide confirmation" : "Show confirmation"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || Boolean(successMsg)}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3.5 text-sm font-bold uppercase tracking-widest text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all hover:bg-[#E5C158] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang xác nhận...
            </>
          ) : (
            <>
              Xác nhận
              <ShieldCheck className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
