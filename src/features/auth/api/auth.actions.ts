"use server";

import { cookies } from "next/headers";
import {
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  AuthTokens,
} from "./auth.dto";

// Lấy Base URL từ biến môi trường
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// ==========================================
// UTILS: QUẢN LÝ COOKIES BẢO MẬT
// ==========================================

// Hàm lưu token vào HttpOnly Cookie
async function setAuthCookies(tokens: AuthTokens) {
  // THÊM AWAIT Ở ĐÂY
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // Access Token: Thường sống ngắn (ví dụ: 1 giờ)
  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 giờ
  });

  // Refresh Token: Sống lâu hơn (ví dụ: 7 ngày)
  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });
}

// Hàm xóa token khi Logout hoặc Token bị thu hồi
export async function clearAuthCookies() {
  // THÊM AWAIT Ở ĐÂY
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

// Hàm lấy refresh token từ Cookie (dùng để gọi API logout hoặc refresh)
export async function getRefreshToken() {
  // THÊM AWAIT Ở ĐÂY
  const cookieStore = await cookies();
  return cookieStore.get("refreshToken")?.value;
}

// ==========================================
// SERVER ACTIONS: GỌI API BACKEND TALEX
// ==========================================

export async function loginAction(data: LoginRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok || !responseData.success) {
      return { success: false, error: responseData };
    }

    // Đăng nhập thành công -> Lưu Cookie an toàn -> Trả về báo cáo thành công cho UI
    const tokens: AuthTokens = responseData.data;
    await setAuthCookies(tokens);

    return { success: true, data: responseData.data };
  } catch (error) {
    return { success: false, error: { message: "Internal Server Error" } };
  }
}

export async function registerAction(data: RegisterRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok || !responseData.success) {
      return { success: false, error: responseData };
    }

    // Trả về verificationToken để FE dùng cho bước xác minh OTP
    // (Không lưu token này vào cookie vì nó chỉ dùng tạm thời)
    return { success: true, data: responseData.data };
  } catch (error) {
    return { success: false, error: { message: "Internal Server Error" } };
  }
}

export async function verifyEmailAction(data: VerifyOtpRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok || !responseData.success) {
      return { success: false, error: responseData };
    }

    // Xác minh thành công -> BE trả về 2 token chính thức -> Cất vào Cookie
    const tokens: AuthTokens = responseData.data;
    await setAuthCookies(tokens);

    return { success: true, data: responseData.data };
  } catch (error) {
    return { success: false, error: { message: "Internal Server Error" } };
  }
}

export async function resendOtpAction(data: ResendOtpRequest) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok || !responseData.success) {
      return { success: false, error: responseData };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: { message: "Internal Server Error" } };
  }
}

export async function logoutAction() {
  try {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      // Gọi BE để xóa token family trên Redis
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }

    // Dù BE phản hồi thế nào, FE vẫn phải xóa Cookie để đăng xuất triệt để
    await clearAuthCookies();

    return { success: true };
  } catch (error) {
    await clearAuthCookies();
    return { success: false };
  }
}
