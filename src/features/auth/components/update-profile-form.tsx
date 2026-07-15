"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { updateMyProfile } from "../api/auth.api";
import { UpdateProfileRequest } from "../api/auth.dto";
import { isFullProfile, useAuthStore } from "../store/auth.store";

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Có lỗi xảy ra khi cập nhật thông tin.";
}

export function UpdateProfileForm() {
  const { user, setUser } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isFullProfile(user)) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const formData = new FormData(e.currentTarget);

    const payload: UpdateProfileRequest = {
      username: formData.get("username") as string,
      fullName: formData.get("fullName") as string,
      phone: formData.get("phone") as string,
      dateOfBirth: formData.get("dateOfBirth") as string,
    };

    try {
      const updatedProfile = await updateMyProfile(payload);
      setUser(updatedProfile);
      setSuccessMsg("Cập nhật thông tin thành công!");
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#121214]/88 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-[#D4AF37]/35 sm:p-7">
      <div className="mb-7">
        <h2 className="text-xl font-semibold tracking-normal text-white/90">
          Thông tin cá nhân
        </h2>
        <p className="mt-2 text-sm font-normal leading-relaxed text-slate-400">
          Cập nhật thông tin hồ sơ để TaleX cá nhân hóa trải nghiệm của bạn.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#E50914]/20 bg-[#E50914]/10 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#E50914]" />
          <p className="text-sm font-medium text-[#ff6b73]">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
          <p className="text-sm font-medium text-emerald-300">{successMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Tên đăng nhập">
            <input
              type="text"
              name="username"
              defaultValue={user.username || ""}
              required
              className={inputClassName}
            />
          </FormField>

          <FormField label="Họ và tên">
            <input
              type="text"
              name="fullName"
              defaultValue={user.fullName || ""}
              required
              className={inputClassName}
            />
          </FormField>

          <FormField label="Số điện thoại">
            <input
              type="tel"
              name="phone"
              defaultValue={user.phone || ""}
              placeholder="+84..."
              className={inputClassName}
            />
          </FormField>

          <FormField label="Ngày sinh">
            <input
              type="date"
              name="dateOfBirth"
              defaultValue={user.dateOfBirth || ""}
              className={`${inputClassName} [color-scheme:dark]`}
            />
          </FormField>
        </div>

        <div className="flex justify-end border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-6 text-sm font-semibold text-black shadow-[0_0_18px_rgba(212,175,55,0.18)] transition hover:bg-[#E5C158] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#0B0B0C] px-4 py-3.5 text-sm text-white/90 outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/50";

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
