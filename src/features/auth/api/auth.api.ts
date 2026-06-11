import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import { UserProfile } from "./auth.dto";

/**
 * Gọi API lấy thông tin cá nhân của người dùng đang đăng nhập.
 * Yêu cầu phải có Token hợp lệ.
 */
export async function getMyProfile() {
  // Gọi trực tiếp đến Backend, không dùng Mock Data để tránh lỗi logic FE.
  // Lỗi (nếu có) sẽ được ném lên cho AuthProvider xử lý.
  return await unwrapBaseResponse<UserProfile>(httpClient.get("/api/auth/me"));
}
