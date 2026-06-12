import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refreshToken")?.value;

    // Nếu không có refresh token trong cookie -> Chắc chắn đã đăng xuất hoặc hết hạn
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "No refresh token" },
        { status: 401 },
      );
    }

    // Gọi thẳng sang Spring Boot Backend
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const responseData = await res.json();

    if (!res.ok || !responseData.success) {
      // Backend từ chối (Lỗi 4016, 4017) -> Xóa sạch Cookie để ép user đăng nhập lại
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return NextResponse.json(responseData, { status: res.status });
    }

    // Lấy thành công Token mới -> Cập nhật lại HttpOnly Cookies
    const useSecure = process.env.COOKIE_SECURE === "true";
    const newTokens = responseData.data;

    cookieStore.set("accessToken", newTokens.accessToken, {
      httpOnly: true,
      secure: useSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    cookieStore.set("refreshToken", newTokens.refreshToken, {
      httpOnly: true,
      secure: useSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
