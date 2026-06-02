"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative">
      {/* Tiêu đề */}
      <div className="mb-8 text-center">
        <h1 className="text-lg sm:text-xl font-medium text-gray-200 tracking-wide">
          Khởi đầu Hành trình của bạn
        </h1>
      </div>

      <form className="space-y-5">
        {/* Input Email */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Email</label>
          <input
            type="email"
            placeholder="email@example.com"
            className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 text-sm text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
          />
        </div>

        {/* Input Password */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3.5 pr-11 text-sm text-white placeholder:text-gray-700 focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#D4AF37] transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Nút Đăng Ký đỏ rực Cinematic */}
        <button
          type="button" // Sau này đổi thành submit khi ráp API
          className="mt-8 w-full rounded-lg bg-[#E50914] py-3.5 text-sm font-bold text-white shadow-[0_4px_20px_rgba(229,9,20,0.3)] transition-all hover:bg-[#ff0a16] hover:shadow-[0_4px_25px_rgba(229,9,20,0.5)] active:scale-[0.98] tracking-widest uppercase"
        >
          Đăng Ký
        </button>
      </form>

      {/* Divider */}
      <div className="my-8 flex items-center">
        <div className="flex-grow border-t border-white/5"></div>
        <span className="mx-4 text-xs text-gray-500">Hoặc tiếp tục với</span>
        <div className="flex-grow border-t border-white/5"></div>
      </div>

      {/* Nút Login Google */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-white/10 bg-[#121214] p-3.5 text-sm font-medium text-gray-300 transition-all hover:bg-white/5 hover:text-white hover:border-white/20"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="h-5 w-5"
        />
        Tiếp tục với Google
      </button>

      {/* Navigate qua Login */}
      <p className="mt-8 text-center text-xs sm:text-sm text-gray-400">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#D4AF37] hover:text-[#E5C158] transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
