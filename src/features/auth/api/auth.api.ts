import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import { UserProfile } from "./auth.dto";

/**
 * Gọi API lấy thông tin cá nhân của người dùng đang đăng nhập.
 * (TẠM THỜI MOCK DỮ LIỆU VÌ BACKEND CHƯA CÓ API NÀY)
 */
export async function getMyProfile() {
  try {
    // Thử gọi API thật (sau này BE có thì nó tự chạy đúng)
    return await unwrapBaseResponse<UserProfile>(
      httpClient.get("/api/v1/users/me"),
    );
  } catch (error) {
    // NẾU API LỖI (VÌ CHƯA TỒN TẠI) -> TRẢ VỀ USER GIẢ ĐỂ FE HOẠT ĐỘNG
    console.warn("⚠️ API Profile chưa sẵn sàng. Đang dùng Mock Data.");

    const mockUser: UserProfile = {
      id: "mock-123",
      email: "user@talex.com",
      username: "talex_member",
      fullName: "TaleX User",
      role: "VIEWER",
      status: "ACTIVE",
    };

    return mockUser;
  }
}
