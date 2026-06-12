"use client";

import { useState } from "react";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { changePassword } from "../api/auth.api";
import { isFullProfile, useAuthStore } from "../store/auth.store";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi đổi mật khẩu.";
}

export function ChangePasswordForm() {
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States để ẩn/hiện mật khẩu
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Nếu user chưa được load thì ẩn form
  if (!isFullProfile(user)) return null;

  // Biến kiểm tra xem user có bắt buộc phải nhập mật khẩu cũ không
  // Nếu user đăng ký bằng Google (hasPassword = false), họ không cần nhập mật khẩu cũ
  const requiresCurrentPassword = user.hasPassword !== false;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword") as
      | string
      | undefined;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    // 1. Validate Frontend: Kiểm tra mật khẩu mới và xác nhận có khớp không
    if (newPassword !== confirmPassword) {
      setErrorMsg("Mật khẩu xác nhận không khớp với mật khẩu mới.");
      setIsLoading(false);
      return;
    }

    try {
      // 2. Gọi API đổi mật khẩu
      await changePassword({
        currentPassword: currentPassword || undefined,
        newPassword,
        confirmPassword,
      });

      // 3. Xử lý khi thành công
      setSuccessMsg("Đổi mật khẩu thành công!");

      // Xóa trắng form sau khi đổi thành công
      const form = e.target as HTMLFormElement;
      form.reset();
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 shadow-xl backdrop-blur-xl mt-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-[#D4AF37]/10 rounded-lg">
          <KeyRound className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-200">
            {requiresCurrentPassword ? "Đổi Mật Khẩu" : "Thiết lập Mật Khẩu"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {requiresCurrentPassword
              ? "Bảo mật tài khoản của bạn"
              : "Thêm mật khẩu để đăng nhập bằng email"}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-[#E50914]/10 border border-[#E50914]/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#E50914] shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-[#E50914]">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-green-500">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chỉ hiển thị ô Mật khẩu hiện tại nếu user có mật khẩu */}
        {requiresCurrentPassword && (
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                name="currentPassword"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 pr-11 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37] transition-colors"
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Form Mật khẩu mới và Xác nhận */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                required
                minLength={8}
                placeholder="Ít nhất 8 ký tự"
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 pr-11 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37] transition-colors"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                required
                minLength={8}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 pr-11 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37] transition-colors"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex justify-center items-center gap-2 rounded-lg bg-[#121214] border border-white/10 hover:border-[#D4AF37]/50 py-3 px-6 text-sm font-bold text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            "Cập nhật mật khẩu"
          )}
        </button>
      </form>
    </div>
  );
}
