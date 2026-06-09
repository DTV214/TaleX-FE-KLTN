"use client";

import { useEffect } from "react";
import { getMyProfile } from "../api/auth.api";
import { useAuthStore } from "../store/auth.store";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setInitialized, isInitialized } = useAuthStore();

  useEffect(() => {
    // Hàm chạy ngầm để kiểm tra phiên đăng nhập
    async function initAuth() {
      try {
        const profile = await getMyProfile();
        setUser(profile); // Đăng nhập hợp lệ -> Lưu thông tin
      } catch (error) {
        setUser(null); // Lỗi 401 (chưa có token/hết hạn) -> Không lưu
      } finally {
        setInitialized(true); // Đánh dấu là đã kiểm tra xong
      }
    }

    // Chỉ chạy kiểm tra nếu hệ thống chưa được khởi tạo
    if (!isInitialized) {
      initAuth();
    }
  }, [isInitialized, setUser, setInitialized]);

  // Trong lúc đang gửi API kiểm tra lần đầu, ta có thể không hiển thị gì cả
  // (hoặc hiển thị một Spinner Loading toàn màn hình) để tránh việc giao diện
  // bị chớp nháy (từ chưa đăng nhập -> đột ngột chuyển thành đã đăng nhập).
  if (!isInitialized) {
    return null; // Tạm thời ẩn UI cho đến khi biết chắc chắn user là ai
  }

  return <>{children}</>;
}
