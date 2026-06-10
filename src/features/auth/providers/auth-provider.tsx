"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMyProfile } from "../api/auth.api";
import { useAuthStore, isFullProfile } from "../store/auth.store";
import { clearAuthCookies } from "@/features/auth/api/auth.actions";
// Thêm dòng import Server Action vào đây:


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser, clearAuth, setInitialized, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchFullProfile() {
      try {
        // Gọi API lấy thông tin đầy đủ
        const fullProfile = await getMyProfile();

        // Cập nhật đắp thêm thông tin vào Store
        updateUser(fullProfile);
      } catch (error) {
        console.error(
          "Phiên đăng nhập không hợp lệ hoặc tài khoản bị khóa:",
          error,
        );

        // 1. Xóa cookie an toàn bằng Server Action
        await clearAuthCookies();

        // 2. Xóa state trên giao diện
        clearAuth();

        // 3. Đá văng về trang Login nếu đang đứng ở các khu vực cần bảo vệ
        const protectedPrefixes = [
          "/admin",
          "/staff",
          "/creator-dashboard",
          "/settings",
        ];
        if (protectedPrefixes.some((prefix) => pathname.startsWith(prefix))) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      } finally {
        setInitialized(true);
      }
    }

    // Kịch bản 1: App vừa khởi chạy (F5 Reload)
    if (!isInitialized) {
      if (user && !isFullProfile(user)) {
        // Có token/payload từ Server truyền xuống nhưng chưa có Full Profile
        fetchFullProfile();
      } else {
        // Không có user -> Không cần gọi API
        setInitialized(true);
      }
    }
    // Kịch bản 2: User vừa điền form Login xong (isInitialized đã là true từ trước)
    // Store vừa được set một PartialUser, ta bắt được sự thay đổi này và đi lấy Profile
    else if (user && !isFullProfile(user)) {
      fetchFullProfile();
    }
  }, [
    user,
    isInitialized,
    updateUser,
    clearAuth,
    setInitialized,
    pathname,
    router,
  ]);

  // Trong lúc hệ thống đang quyết định xem user là ai, tạm ẩn UI để tránh nhấp nháy
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}
