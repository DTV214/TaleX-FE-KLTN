import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Danh sách các đường dẫn yêu cầu PHẢI ĐĂNG NHẬP
const protectedRoutes = ["/admin", "/staff", "/creator-dashboard", "/settings"];

// Danh sách các đường dẫn dành cho KHÁCH (Đã đăng nhập rồi thì không cho vào lại)
const authRoutes = ["/login", "/register", "/forgot-password"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Lấy token từ HttpOnly Cookies
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  const hasToken = !!(accessToken || refreshToken);

  // 1. Nếu đang vào trang Auth (Login/Register) mà ĐÃ có Token -> Đẩy về Trang chủ
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (hasToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // 2. Nếu đang vào trang Protected (Admin/Staff/Creator...) mà CHƯA có Token -> Đẩy về Login
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!hasToken) {
      const loginUrl = new URL("/login", request.url);
      // Lưu lại đường dẫn cũ để đăng nhập xong có thể quay lại đúng chỗ đó (tùy chọn)
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. Nếu hợp lệ hết, cho phép đi tiếp
  return NextResponse.next();
}

// Cấu hình matcher để Next.js biết Middleware này nên chạy ở những route nào
// (Tối ưu hiệu suất: Bỏ qua các file tĩnh, ảnh, api nội bộ...)
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (favicon files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
