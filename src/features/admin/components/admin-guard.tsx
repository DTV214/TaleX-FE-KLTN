"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/features/auth/store/auth.store";

const ALLOWED_ROLES = ["ADMIN", "STAFF"] as const;

/**
 * UX guard cho `/admin/*` — KHÔNG phải authz thật (client-side check bypass được qua
 * devtools). BE vẫn là chốt chặn thật sự (VD GET/PUT/DELETE /api/v1/subscriptions
 * yêu cầu ADMIN/STAFF). Guard này chỉ tránh user thường vô tình xem được nội dung
 * admin qua URL trực tiếp (info disclosure nhẹ), không thay thế kiểm tra quyền ở BE.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const allowed = user != null && ALLOWED_ROLES.includes(user.roleName as (typeof ALLOWED_ROLES)[number]);

  useEffect(() => {
    if (isInitialized && !allowed) {
      router.replace("/");
    }
  }, [isInitialized, allowed, router]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-3 text-sm font-medium text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
