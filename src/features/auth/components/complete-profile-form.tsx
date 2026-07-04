"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

import { completeProfileAction } from "@/features/auth/api/auth.actions";
import { AuthErrorCode } from "@/features/auth/api/auth.dto";
import { useAuthStore } from "@/features/auth/store/auth.store";

export function CompleteProfileForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verificationToken = searchParams.get("token") || "";

  const { setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const phone = (formData.get("phone") as string).trim();
    const dateOfBirth = formData.get("dateOfBirth") as string;

    if (!verificationToken) {
      setErrorMsg("Thiếu token xác minh. Vui lòng đăng nhập lại bằng Google.");
      setIsLoading(false);
      return;
    }

    const res = await completeProfileAction({
      verificationToken,
      dateOfBirth,
      phone,
    });

    if (!res.success) {
      const errorCode = res.error?.data?.errorCode;
      switch (errorCode) {
        case AuthErrorCode.INVALID_VERIFICATION_TOKEN:
          setErrorMsg("Phiên đã hết hạn. Vui lòng đăng nhập lại bằng Google.");
          break;
        case AuthErrorCode.PROFILE_INCOMPLETE:
          setErrorMsg("Tài khoản không ở trạng thái cần hoàn tất hồ sơ.");
          break;
        default:
          setErrorMsg(
            res.error?.message || "Không thể hoàn tất hồ sơ. Vui lòng thử lại.",
          );
      }
      setIsLoading(false);
      return;
    }

    if (res.data?.user) {
      setUser(res.data.user);
    }

    setSuccessMsg("Hoàn tất hồ sơ thành công! Đang chuyển hướng...");
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  }

  if (!verificationToken) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
        <AlertCircle className="w-12 h-12 text-[#E50914] mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-200 mb-2">Thiếu thông tin xác minh</h2>
        <p className="text-sm text-gray-400 mb-6">
          Vui lòng đăng nhập bằng Google để bắt đầu quá trình tạo tài khoản.
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
      <div className="mb-8 text-center">
        <h1 className="text-lg sm:text-xl font-medium text-gray-200 tracking-wide">
          Hoàn tất hồ sơ
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Thêm số điện thoại và ngày sinh để kích hoạt tài khoản
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-emerald-400">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Số điện thoại</label>
          <input
            type="tel"
            name="phone"
            required
            placeholder="0912345678"
            pattern="^(0\d{9}|\+84\d{9})$"
            title="Số điện thoại Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx"
            className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Ngày sinh</label>
          <input
            type="date"
            name="dateOfBirth"
            required
            className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white [color-scheme:dark] focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !!successMsg}
          className="mt-8 flex w-full justify-center items-center gap-2 rounded-lg bg-[#D4AF37] py-3.5 text-sm font-bold text-black shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-all hover:bg-[#E5C158] hover:shadow-[0_4px_25px_rgba(212,175,55,0.5)] active:scale-[0.98] tracking-widest uppercase disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Hoàn tất"
          )}
        </button>
      </form>
    </div>
  );
}
