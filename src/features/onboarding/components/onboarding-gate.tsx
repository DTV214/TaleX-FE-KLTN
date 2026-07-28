"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  isMissingUserFeatureError,
  useUserFeatureProfile,
} from "../api/user-onboarding.api";

const ignoredRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
  "/onboarding",
  "/admin",
  "/staff",
  "/creator-dashboard",
  "/watch",
  "/read",
];

function shouldIgnorePath(pathname: string) {
  return ignoredRoutes.some((route) => pathname.startsWith(route));
}

export function OnboardingGate() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isStaffRole = user?.roleName === "ADMIN" || user?.roleName === "STAFF";
  const canCheck =
    isAuthenticated &&
    Boolean(user) &&
    !isStaffRole &&
    !shouldIgnorePath(pathname);

  const profileQuery = useUserFeatureProfile(canCheck);
  const isMissingSurvey =
    profileQuery.isError && isMissingUserFeatureError(profileQuery.error);

  useEffect(() => {
    if (!isMissingSurvey) return;

    const currentQuery =
      typeof window !== "undefined"
        ? window.location.search.replace(/^\?/, "")
        : "";
    const nextPath = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    router.replace(`/onboarding?next=${encodeURIComponent(nextPath)}`);
  }, [isMissingSurvey, pathname, router]);

  useEffect(() => {
    if (profileQuery.isError && !isMissingSurvey) {
      console.error(
        "[Onboarding] Cannot check user feature profile",
        profileQuery.error,
      );
    }
  }, [isMissingSurvey, profileQuery.error, profileQuery.isError]);

  return null;
}
