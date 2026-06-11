import { httpClient, unwrapBaseResponse } from "@/shared/api/http-client";
import {
  UserProfile,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "./auth.dto";

/**
 * Gọi API lấy thông tin cá nhân của người dùng đang đăng nhập.
 * Yêu cầu phải có Token hợp lệ.
 */
export async function getMyProfile() {
  return await unwrapBaseResponse<UserProfile>(httpClient.get("/api/auth/me"));
}

/**
 * Gọi API cập nhật thông tin cá nhân (Update Profile).
 * Gửi lên các trường muốn cập nhật, BE sẽ trả về Profile mới.
 */
export async function updateMyProfile(data: UpdateProfileRequest) {
  return await unwrapBaseResponse<UserProfile>(
    httpClient.put("/api/auth/me", data),
  );
}

/**
 * Gọi API đổi mật khẩu (Change Password).
 * Yêu cầu gửi mật khẩu hiện tại (nếu có), mật khẩu mới và xác nhận.
 */
export async function changePassword(data: ChangePasswordRequest) {
  // Vì API change-password trả về data là một chuỗi string (vd: "Đổi mật khẩu thành công")
  // ta để Generic type là <string>
  return await unwrapBaseResponse<string>(
    httpClient.post("/api/auth/change-password", data),
  );
}
