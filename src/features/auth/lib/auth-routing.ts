import type { UserRole } from "@/features/auth/api/auth.dto";

const ROLE_LANDING_PATHS: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  STAFF: "/staff/dashboard",
  CREATOR: "/creator-dashboard",
  VIEWER: "/",
};

const AUTH_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
];

function matchesPathPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getRoleLandingPath(role: UserRole) {
  return ROLE_LANDING_PATHS[role];
}

export function isUserRole(value: unknown): value is UserRole {
  return (
    value === "ADMIN" ||
    value === "STAFF" ||
    value === "CREATOR" ||
    value === "VIEWER"
  );
}

function canAccessCallbackPath(role: UserRole, pathname: string) {
  if (AUTH_PATHS.some((path) => matchesPathPrefix(pathname, path))) {
    return false;
  }

  if (matchesPathPrefix(pathname, "/admin")) {
    return role === "ADMIN";
  }

  if (matchesPathPrefix(pathname, "/staff")) {
    return role === "STAFF" || role === "ADMIN";
  }

  if (matchesPathPrefix(pathname, "/creator-dashboard")) {
    return role === "CREATOR";
  }

  return true;
}

function getCanonicalCallbackPath(pathname: string) {
  if (pathname === "/admin") return "/admin/dashboard";
  if (pathname === "/staff") return "/staff/dashboard";

  return pathname;
}

export function getPostLoginPath(
  role: UserRole,
  callbackUrl?: string | null,
) {
  const landingPath = getRoleLandingPath(role);

  if (
    !callbackUrl ||
    !callbackUrl.startsWith("/") ||
    callbackUrl.startsWith("//")
  ) {
    return landingPath;
  }

  try {
    const callback = new URL(callbackUrl, "http://localhost");

    if (!canAccessCallbackPath(role, callback.pathname)) {
      return landingPath;
    }

    return `${getCanonicalCallbackPath(callback.pathname)}${callback.search}${callback.hash}`;
  } catch {
    return landingPath;
  }
}
