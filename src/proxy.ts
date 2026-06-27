import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getRoleLandingPath,
  isUserRole,
} from "@/features/auth/lib/auth-routing";

const authRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
];
const adminRoutes = ["/admin"];
const staffRoutes = ["/staff"];
const creatorRoutes = ["/creator-dashboard"];
const generalProtectedRoutes = ["/settings", "/profile"];

const allProtectedRoutes = [
  ...adminRoutes,
  ...staffRoutes,
  ...creatorRoutes,
  ...generalProtectedRoutes,
];

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function matchesAnyRoute(pathname: string, routes: string[]) {
  return routes.some((route) => matchesPathPrefix(pathname, route));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((character) =>
          `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`,
        )
        .join(""),
    );
    const payload: unknown = JSON.parse(jsonPayload);

    return typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasToken = Boolean(accessToken || refreshToken);

  const payload = accessToken ? decodeJwtPayload(accessToken) : null;
  const role = isUserRole(payload?.role) ? payload.role : "VIEWER";

  if (matchesAnyRoute(pathname, authRoutes)) {
    if (hasToken) {
      return NextResponse.redirect(
        new URL(getRoleLandingPath(role), request.url),
      );
    }

    return NextResponse.next();
  }

  if (!matchesAnyRoute(pathname, allProtectedRoutes)) {
    return NextResponse.next();
  }

  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (pathname === "/staff") {
    return NextResponse.redirect(new URL("/staff/dashboard", request.url));
  }

  // Preserve the existing refresh flow: when only a refresh token remains,
  // AuthProvider refreshes the session before role-based checks can be reliable.
  if (accessToken) {
    if (matchesAnyRoute(pathname, adminRoutes) && role !== "ADMIN") {
      return NextResponse.redirect(
        new URL(getRoleLandingPath(role), request.url),
      );
    }

    if (
      matchesAnyRoute(pathname, staffRoutes) &&
      role !== "STAFF" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL(getRoleLandingPath(role), request.url),
      );
    }

    // Allow both CREATOR and VIEWER to enter Creator Studio. VIEWER users are
    // handled by CreatorGuard for onboarding and terms acceptance.
    if (
      matchesAnyRoute(pathname, creatorRoutes) &&
      role !== "CREATOR" &&
      role !== "VIEWER"
    ) {
      return NextResponse.redirect(
        new URL(getRoleLandingPath(role), request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
