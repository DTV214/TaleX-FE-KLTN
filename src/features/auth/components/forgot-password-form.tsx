"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Mail,
} from "lucide-react";
import { forgotPasswordAction } from "../api/auth.actions";
import { AuthErrorCode } from "../api/auth.dto";

type ForgotPasswordFormProps = {
  initialEmail?: string;
  onSuccess: ({ token, email }: { token: string; email: string }) => void;
};

function getForgotPasswordErrorMessage(errorCode?: AuthErrorCode, message?: string) {
  switch (errorCode) {
    case AuthErrorCode.ACCOUNT_BANNED:
      return "Tài khoản của bạn đã bị khóa.";
    case AuthErrorCode.ACCOUNT_NOT_ACTIVE:
      return "Tài khoản chưa ở trạng thái hoạt động.";
    case AuthErrorCode.EMAIL_SERVICE_UNAVAILABLE:
      return "Dịch vụ gửi email đang gián đoạn. Vui lòng thử lại sau.";
    default:
      return message || "Không thể gửi mã xác thực. Vui lòng kiểm tra lại email.";
  }
}

export function ForgotPasswordForm({
  initialEmail = "",
  onSuccess,
}: ForgotPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim().toLowerCase() || "";

    if (!email) {
      setErrorMsg("Vui lòng nhập email tài khoản.");
      setIsLoading(false);
      return;
    }

    const res = await forgotPasswordAction({ email });

    if (!res.success) {
      setErrorMsg(
        getForgotPasswordErrorMessage(
          res.error?.data?.errorCode,
          res.error?.message,
        ),
      );
      setIsLoading(false);
      return;
    }

    onSuccess({ token: res.data.verificationToken, email });
    setIsLoading(false);
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      <Link
        href="/login"
        className="absolute left-8 top-8 text-gray-400 transition-colors hover:text-white"
        aria-label="Back to login"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      <div className="mb-8 pt-2 text-center">
        <h1 className="text-lg sm:text-xl font-medium tracking-wide text-gray-200">
          Quên mật khẩu?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-400">
          Nhập email để TaleX gửi mã OTP khôi phục tài khoản.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E50914]/20 bg-[#E50914]/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E50914]" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-400">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              name="email"
              required
              defaultValue={initialEmail}
              autoComplete="email"
              placeholder="email@example.com"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pl-11 text-sm text-white shadow-inner transition-all placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] py-3.5 text-sm font-bold uppercase tracking-widest text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all hover:bg-[#E5C158] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang gửi mã...
            </>
          ) : (
            <>
              Tiếp tục
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-xs sm:text-sm text-gray-400">
        Đã nhớ mật khẩu?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#D4AF37] transition-colors hover:text-[#E5C158]"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
