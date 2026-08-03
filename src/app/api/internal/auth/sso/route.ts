import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

// Chỉ cho phép redirect nội bộ (path tương đối) — chặn open-redirect qua
// `//host` (scheme-relative) hoặc URL tuyệt đối (`https://...`).
function sanitizeRedirect(target: string | null): string {
  if (
    !target ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.includes("://")
  ) {
    return "/";
  }
  return target;
}

/**
 * Mobile mở link này kèm 1 one-time code (xin từ `/api/auth/sso-handoff`) để
 * tự động đăng nhập trên web, thay vì bắt user gõ lại mật khẩu. Đây là "đường
 * tắt" — nếu code sai/hết hạn, chỉ rơi về `/login` bình thường, không phải lỗi
 * cứng.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const safeRedirect = sanitizeRedirect(searchParams.get("redirect"));

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/sso-handoff/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const responseData = await res.json();

    if (!res.ok || !responseData.success) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(safeRedirect)}`, origin),
      );
    }

    const tokens = responseData.data;
    const cookieStore = await cookies();
    const useSecure = process.env.COOKIE_SECURE === "true";

    // Cùng shape với setAuthCookies() trong features/auth/api/auth.actions.ts
    // và src/app/api/internal/auth/refresh/route.ts — giữ 3 nơi khớp nhau nếu sửa.
    cookieStore.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: useSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 150 * 60,
    });
    cookieStore.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: useSecure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL(safeRedirect, origin), { status: 307 });
  } catch {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(safeRedirect)}`, origin),
    );
  }
}
