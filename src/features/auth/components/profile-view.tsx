"use client";

import axios from "axios";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Camera,
  Crown,
  Loader2,
  Mail,
  ReceiptText,
  ShieldCheck,
  Timer,
  User,
} from "lucide-react";
import { updateMyProfile } from "../api/auth.api";
import { isFullProfile, useAuthStore } from "../store/auth.store";
import { getImagePresignedUpload } from "@/features/creator-dashboard/api/s3-upload-api";
import { useActiveSubscription } from "@/features/payment/api/payment.api";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { parseBackendDate } from "@/shared/utils/backend-date";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function formatSubscriptionDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseBackendDate(value));
}

function getRemainingDays(endTime: string) {
  const diffMs = parseBackendDate(endTime).getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / 86_400_000));
}

function getSubscriptionProgress(startTime: string, endTime: string) {
  const startMs = parseBackendDate(startTime).getTime();
  const endMs = parseBackendDate(endTime).getTime();
  const totalMs = endMs - startMs;

  if (totalMs <= 0) {
    return 100;
  }

  const usedMs = Date.now() - startMs;
  return Math.min(100, Math.max(0, (usedMs / totalMs) * 100));
}

export function ProfileView() {
  const { user, setUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const isProfileLoaded = isFullProfile(user);
  const activeSubscriptionQuery = useActiveSubscription(isProfileLoaded);

  if (!isProfileLoaded) return null;

  const activeSubscription = activeSubscriptionQuery.data;
  const isPremiumMember = Boolean(activeSubscription);
  const remainingDays = activeSubscription
    ? getRemainingDays(activeSubscription.endTime)
    : 0;
  const subscriptionProgress = activeSubscription
    ? getSubscriptionProgress(activeSubscription.startTime, activeSubscription.endTime)
    : 0;

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
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#121214]/88 p-6 text-center shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-[#D4AF37]/35 sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.14),transparent_38%)]" />

        <div className="relative z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="group relative mx-auto block h-28 w-28 cursor-pointer overflow-visible rounded-full border border-[#D4AF37]/35 bg-[#0B0B0C] p-1 shadow-[0_0_28px_rgba(212,175,55,0.18)] outline-none transition hover:border-[#D4AF37] focus-visible:ring-2 focus-visible:ring-[#D4AF37]/70 disabled:cursor-wait"
            aria-label="Cập nhật ảnh đại diện"
          >
            {isPremiumMember && (
              <span className="absolute -right-1 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-black bg-[#D4AF37] text-black shadow-[0_0_22px_rgba(212,175,55,0.45)]">
                <Crown className="h-4 w-4" />
              </span>
            )}

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

          <h2 className="mt-5 text-2xl font-semibold tracking-normal text-white/90">
            {user.fullName || "TaleX User"}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            @{user.username}
          </p>

          {isPremiumMember && (
            <Badge variant="premium" className="mt-4 gap-1.5 px-3 py-1 text-xs font-medium">
              <Crown className="h-3.5 w-3.5" />
              Thành viên Premium
            </Badge>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121214]/88 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:border-[#D4AF37]/35 sm:p-6">
        <h3 className="border-b border-white/10 pb-4 text-sm font-medium text-[#D4AF37]">
          Thông tin liên hệ
        </h3>

        <div className="mt-5 flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#0B0B0C] text-[#D4AF37]">
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Email</p>
            <p className="mt-1 truncate text-sm font-semibold text-white/90">
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#0B0B0C] text-[#D4AF37]">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-slate-500">Trạng thái</p>
            <p className="mt-1 text-sm font-semibold text-white/86">
              {isPremiumMember ? "Premium đang hoạt động" : "Tài khoản thường"}
            </p>
          </div>
        </div>

        {activeSubscriptionQuery.isLoading && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">
            <div className="h-4 w-32 animate-pulse rounded-full bg-white/10" />
            <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-white/10" />
          </div>
        )}

        {activeSubscription && (
          <div className="mt-4 overflow-hidden rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.055] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-medium text-[#F5D46E]/80">
                  <Timer className="h-4 w-4" />
                  Thời hạn gói
                </p>
                <p className="mt-2 text-xl font-semibold text-white/90">
                  Còn {remainingDays} ngày
                </p>
              </div>
              <Badge variant="premium" className="px-3 py-1 text-xs font-medium">
                Premium
              </Badge>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-400">
                <span>Tiến độ sử dụng</span>
                <span className="tabular-nums text-[#F5D46E]">
                  {Math.round(subscriptionProgress)}%
                </span>
              </div>
              <Progress value={subscriptionProgress} className="h-1.5" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Bắt đầu
                </p>
                <p className="mt-1 text-sm font-semibold text-white/88">
                  {formatSubscriptionDate(activeSubscription.startTime)}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Kết thúc
                </p>
                <p className="mt-1 text-sm font-semibold text-white/88">
                  {formatSubscriptionDate(activeSubscription.endTime)}
                </p>
              </div>
            </div>

            <Link
              href="/premium-history"
              className="mt-4 flex h-11 items-center justify-center gap-2 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 text-sm font-medium text-[#F5D46E] transition hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/15"
            >
              <ReceiptText className="h-4 w-4" />
              Xem lịch sử Premium
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
