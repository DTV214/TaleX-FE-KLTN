"use server";

import { cookies } from "next/headers";
import {
  LoginRequest,
  RegisterRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  AuthTokens,
  UserRole,
} from "./auth.dto";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// ==========================================
// UTILS: QUẢN LÝ COOKIES & JWT
// ==========================================

// Hàm giải mã JWT an toàn không cần cài thêm thư viện (chạy được trên Server/Edge)
function decodeJwtPayload(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Sử dụng Buffer thay cho atob để tương thích tốt nhất với môi trường Server của Next.js
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

async function setAuthCookies(tokens: AuthTokens) {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("accessToken", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // 1 giờ
  });

  cookieStore.set("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

export async function getRefreshToken() {
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

    const tokens: AuthTokens = responseData.data;
    await setAuthCookies(tokens);

    // BƯỚC MỚI: Giải mã token để lấy thông tin cơ bản ngay lập tức
    const payload = decodeJwtPayload(tokens.accessToken);
    const partialUser = {
      id: payload?.sub || "",
      role: (payload?.role as UserRole) || "VIEWER",
    };

    // Trả cả tokens (nếu UI cần) và partialUser về cho Client Store
    return {
      success: true,
      data: {
        tokens,
        user: partialUser,
      },
    };
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

    const tokens: AuthTokens = responseData.data;
    await setAuthCookies(tokens);

    // Tương tự hàm Login, giải mã khi verify xong (vì verify xong BE cũng trả về Token)
    const payload = decodeJwtPayload(tokens.accessToken);
    const partialUser = {
      id: payload?.sub || "",
      role: (payload?.role as UserRole) || "VIEWER",
    };

    return {
      success: true,
      data: {
        tokens,
        user: partialUser,
      },
    };
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
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    }

    await clearAuthCookies();
    return { success: true };
  } catch (error) {
    await clearAuthCookies();
    return { success: false };
  }
}
