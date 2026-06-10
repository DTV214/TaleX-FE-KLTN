import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ==========================================
// 1. ĐỊNH NGHĨA CÁC NHÓM ROUTE QUYỀN HẠN
// ==========================================
const authRoutes = ["/login", "/register", "/forgot-password"];

// Tách riêng các route để kiểm tra quyền dễ dàng hơn
const adminRoutes = ["/admin"];
const staffRoutes = ["/staff"];
const creatorRoutes = ["/creator-dashboard"];
const generalProtectedRoutes = ["/settings", "/profile"]; // Ai đăng nhập cũng vào được

// Gộp chung tất cả các route cần bảo vệ
const allProtectedRoutes = [
  ...adminRoutes,
  ...staffRoutes,
  ...creatorRoutes,
  ...generalProtectedRoutes,
];

// ==========================================
// 2. TIỆN ÍCH GIẢI MÃ JWT TRÊN EDGE RUNTIME
// ==========================================
function decodeJwtEdge(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Sử dụng atob thay cho Buffer để chạy an toàn trên Edge Runtime
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

// ==========================================
// 3. MIDDLEWARE CHÍNH
// ==========================================
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ HttpOnly Cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const hasToken = !!(accessToken || refreshToken);

  // Kịch bản 1: Đang vào trang Auth (Login/Register) mà ĐÃ có Token -> Đẩy về Trang chủ
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (hasToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Nếu route hiện tại KHÔNG nằm trong danh sách cần bảo vệ -> Cho đi qua luôn
  const isProtectedRoute = allProtectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Kịch bản 2: Vào trang Protected mà CHƯA có Token -> Đẩy về Login
  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ==========================================
  // Kịch bản 3: KIỂM TRA QUYỀN (RBAC - Role Based Access Control)
  // ==========================================
  if (accessToken) {
    const payload = decodeJwtEdge(accessToken);
    const role = payload?.role || "VIEWER";

    // 3.1 Cố vào Admin nhưng không phải ADMIN
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      if (role !== "ADMIN") {
        // Có thể đẩy về /403 hoặc trang chủ
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // 3.2 Cố vào Staff nhưng không phải ADMIN hay STAFF
    if (staffRoutes.some((route) => pathname.startsWith(route))) {
      if (role !== "STAFF" && role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    // 3.3 Cố vào Creator Dashboard nhưng chỉ là VIEWER
    if (creatorRoutes.some((route) => pathname.startsWith(route))) {
      if (role === "VIEWER") {
        // Đẩy về trang đăng ký làm creator (hoặc trang chủ)
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // Hợp lệ hết, cho phép đi tiếp
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
