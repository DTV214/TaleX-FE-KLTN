"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { updateMyProfile } from "../api/auth.api";
import { isFullProfile, useAuthStore } from "../store/auth.store";
import { UpdateProfileRequest } from "../api/auth.dto";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi cập nhật thông tin.";
}

export function UpdateProfileForm() {
  // 1. Lấy dữ liệu user hiện tại và hàm cập nhật từ Store
  const { user, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Nếu user chưa được load (mặc dù middleware đã chặn, nhưng để an toàn type)
  if (!isFullProfile(user)) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    // 2. Gom dữ liệu từ Form (Chỉ lấy những trường có trong UpdateProfileRequest)
    const payload: UpdateProfileRequest = {
      username: formData.get("username") as string,
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
    };

    try {
      // 3. Gọi API thật
      const updatedProfile = await updateMyProfile(payload);

      // 4. Nếu thành công, ghi đè profile mới vào Zustand Store
      // Giao diện Sidebar/Header sẽ tự động nhận diện tên mới ngay lập tức
      setUser(updatedProfile);
      setSuccessMsg("Cập nhật thông tin thành công!");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 shadow-xl backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-200">
          Thông tin cá nhân
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Cập nhật thông tin hồ sơ của bạn
        </p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Tên đăng nhập */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Tên đăng nhập (Username)
            </label>
            <input
              type="text"
              name="username"
              defaultValue={user.username || ""}
              required
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all"
            />
          </div>

          {/* Họ và tên */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Họ và Tên
            </label>
            <input
              type="text"
              name="fullName"
              defaultValue={user.fullName || ""}
              required
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all"
            />
          </div>

          {/* Số điện thoại */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Số điện thoại
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={user.phone || ""}
              placeholder="+84..."
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all"
            />
          </div>

          {/* Ngày sinh */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 font-medium">
              Ngày sinh
            </label>
            <input
              type="date"
              name="dateOfBirth"
              defaultValue={user.dateOfBirth || ""}
              className="w-full rounded-xl border border-white/10 bg-[#121214] p-3 text-sm text-white focus:border-[#D4AF37]/50 focus:bg-black/50 focus:outline-none transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Email - Field này thường không cho sửa trực tiếp, chỉ hiển thị (Read-only) */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">
            Email (Không thể thay đổi)
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full rounded-xl border border-white/5 bg-white/5 p-3 text-sm text-gray-500 cursor-not-allowed"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex justify-center items-center gap-2 rounded-lg bg-[#D4AF37] hover:bg-[#E5C158] py-3 px-6 text-sm font-bold text-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed ml-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </button>
      </form>
    </div>
  );
}
