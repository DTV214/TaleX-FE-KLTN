"use client";

import { Camera, Mail, User } from "lucide-react";
import { isFullProfile, useAuthStore } from "../store/auth.store";

export function ProfileView() {
  const { user } = useAuthStore();

  if (!isFullProfile(user)) return null;

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-white/5 bg-[#161618] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-8">
        <label className="group relative mx-auto block h-28 w-28 cursor-pointer overflow-hidden rounded-full border border-[#D4AF37]/35 bg-[#0B0B0C] p-1 shadow-[0_0_28px_rgba(212,175,55,0.18)]">
          <span className="relative block h-full w-full overflow-hidden rounded-full bg-[#121214]">
            {user.avatarUrl ? (
              <span
                className="block h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${user.avatarUrl})` }}
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[#D4AF37]">
                <User className="h-11 w-11" />
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <Camera className="h-7 w-7 text-white" />
            </span>
          </span>
          <input type="file" accept="image/*" className="hidden" />
        </label>

        <h2 className="mt-5 font-heading text-2xl font-bold tracking-tight text-white">
          {user.fullName || "TaleX User"}
        </h2>
        <p className="mt-1 text-sm font-medium text-white/45">
          @{user.username}
        </p>
      </section>

      <section className="rounded-2xl border border-white/5 bg-[#161618] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-7">
        <h3 className="border-b border-white/10 pb-4 text-xs font-bold uppercase tracking-[0.18em] text-white/50">
          Thông tin liên hệ
        </h3>

        <div className="mt-5 flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#0B0B0C] text-[#D4AF37]">
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/42">
              Email
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {user.email}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
