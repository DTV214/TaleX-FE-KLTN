"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { logoutAction } from "../api/auth.actions";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  LogOut,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export function ProfileView() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Nếu chưa có thông tin user, không render gì cả (tránh lỗi UI lúc đang load)
  if (!user) return null;

  async function handleLogout() {
    setIsLoggingOut(true);

    // 1. Gọi Server Action để xóa Cookie và Redis
    await logoutAction();

    // 2. Dọn dẹp kho lưu trữ Zustand ở Client
    clearAuth();

    // 3. Đẩy về trang đăng nhập
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Profile */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-[#D4AF37]/5 blur-[80px] pointer-events-none" />

        {/* Avatar */}
        <div className="h-24 w-24 shrink-0 rounded-full border-2 border-[#D4AF37] p-1 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div className="h-full w-full rounded-full bg-[#121214] flex items-center justify-center text-[#D4AF37]">
              <User className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 text-center md:text-left z-10">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-200 tracking-wide">
              {user.fullName}
            </h1>
            {user.status === "ACTIVE" && (
              <div title="Tài khoản đã xác thực">
                <CheckCircle2
                  className="h-5 w-5 text-[#D4AF37]"
                />
              </div>
            )}
          </div>
          <p className="text-sm font-medium text-gray-400">@{user.username}</p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#121214] px-4 py-1.5 shadow-inner">
            <Shield className="h-4 w-4 text-[#D4AF37]" />
            <span className="text-xs font-bold text-[#D4AF37] tracking-widest uppercase">
              {user.role}
            </span>
          </div>
        </div>

        {/* Logout Button (Desktop) */}
        <div className="hidden md:block z-10">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 rounded-lg bg-[#E50914] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#ff0a16] hover:shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Detailed Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
            Thông tin liên hệ
          </h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121214] border border-white/10 text-gray-400 shadow-inner">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  Địa chỉ Email
                </p>
                <p className="text-sm font-semibold text-gray-200">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121214] border border-white/10 text-gray-400 shadow-inner">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  Số điện thoại
                </p>
                <p className="text-sm font-semibold text-gray-200">
                  {user.phone || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
            Thông tin cá nhân
          </h3>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121214] border border-white/10 text-gray-400 shadow-inner">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-0.5">
                  Ngày sinh
                </p>
                <p className="text-sm font-semibold text-gray-200">
                  {user.dateOfBirth || "Chưa cập nhật"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button (Mobile) */}
      <div className="md:hidden pt-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E50914] px-6 py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#ff0a16] hover:shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-[0.98] disabled:opacity-70"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>Đăng Xuất</span>
        </button>
      </div>
    </div>
  );
}
