"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getMyProfile } from "../api/auth.api";
import { useAuthStore, isFullProfile } from "../store/auth.store";
import { clearAuthCookies } from "@/features/auth/api/auth.actions";
// Đảm bảo import đúng đường dẫn Server Action của bạn


export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Thay updateUser thành setUser để có thể ghi đè toàn bộ state khi F5
  const { user, setUser, clearAuth, setInitialized, isInitialized } =
    useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function fetchFullProfile() {
      try {
        // Gọi API lấy thông tin đầy đủ
        const fullProfile = await getMyProfile();

        // Sử dụng setUser thay vì updateUser.
        // Vì khi F5, store đang rỗng (user = null), setUser sẽ khởi tạo lại toàn bộ data.
        setUser(fullProfile);
      } catch (error) {
        console.error(
          "Phiên đăng nhập không hợp lệ, chưa đăng nhập, hoặc tài khoản bị khóa:",
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

    // Kịch bản 1: App vừa khởi chạy hoặc user vừa F5 Reload
    // Lúc này Zustand store đang rỗng, ta BẮT BUỘC phải gọi API để check xem có Cookie hợp lệ không.
    if (!isInitialized) {
      fetchFullProfile();
    }
    // Kịch bản 2: User vừa điền form Login xong
    // Store vừa được set một PartialUser (chỉ có id và role), ta đi gọi API để lấy Full Profile
    else if (user && !isFullProfile(user)) {
      fetchFullProfile();
    }
  }, [
    user,
    isInitialized,
    setUser, // Đưa setUser vào dependency array
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
