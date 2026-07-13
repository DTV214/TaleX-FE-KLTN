"use client";

import axios from "axios";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Mail, User } from "lucide-react";
import { updateMyProfile } from "../api/auth.api";
import { isFullProfile, useAuthStore } from "../store/auth.store";
import { getImagePresignedUpload } from "@/features/creator-dashboard/api/s3-upload-api";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

export function ProfileView() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  if (!isFullProfile(user)) return null;

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng file ảnh.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Ảnh đại diện không được vượt quá 5MB.");
      return;
    }

    try {
      setIsUploadingAvatar(true);

      const presigned = await getImagePresignedUpload({
        fileName: file.name,
        mimeType: file.type || "image/jpeg",
        fileSize: file.size,
        imageContext: "avatar",
      });

      await axios.put(presigned.uploadUrl, file, {
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
      });

      const updatedProfile = await updateMyProfile({
        avatarUrl: presigned.publicUrl,
      });

      setUser(updatedProfile);
      toast.success("Cập nhật ảnh đại diện thành công.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Không thể cập nhật ảnh đại diện.";

      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <section className="rounded-2xl border border-white/5 bg-[#161618] p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] sm:p-8">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          className="group relative mx-auto block h-28 w-28 cursor-pointer overflow-hidden rounded-full border border-[#D4AF37]/35 bg-[#0B0B0C] p-1 shadow-[0_0_28px_rgba(212,175,55,0.18)] outline-none transition focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 disabled:cursor-wait"
          aria-label="Cập nhật ảnh đại diện"
        >
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
            {isUploadingAvatar && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/70">
                <Loader2 className="h-7 w-7 animate-spin text-white" />
              </span>
            )}
          </span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />

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
