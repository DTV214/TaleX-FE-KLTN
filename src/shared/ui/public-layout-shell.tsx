"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";
import { cn } from "@/shared/utils/utils";
import { BackToTop } from "@/shared/ui/back-to-top";
import { PublicSidebar } from "@/shared/ui/public-sidebar";
import { SiteHeader } from "@/shared/ui/site-header";
import { OnboardingGate } from "@/features/onboarding/components/onboarding-gate";

type PublicLayoutShellProps = {
  children: ReactNode;
};

const sidebarRoutes = [
  "/",
  "/series",
  "/comics",
  "/intro",
  "/missions",
  "/profile",
  "/coin-history",
  "/premium",
  "/premium-history",
  "/purchase-history",
  "/liked",
  "/bookmarks",
  "/subscriptions",
  "/creator-channel",
  "/public-channel",
  "/recomment-demo",
  "/ads",
] as const;
const hiddenChromeRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
  "/onboarding",
  "/creator-dashboard",
  "/admin",
  "/staff",
  "/watch",
  "/read",
] as const;
const hiddenHeaderRoutes = ["/read", "/onboarding"] as const;

function shouldShowPublicSidebar(pathname: string) {
  return sidebarRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function shouldOffsetFixedHeader(pathname: string) {
  return !hiddenChromeRoutes.some((route) => pathname.startsWith(route));
}

function shouldShowSiteHeader(pathname: string) {
  return !hiddenHeaderRoutes.some((route) => pathname.startsWith(route));
}

export function PublicLayoutShell({ children }: PublicLayoutShellProps) {
  const pathname = usePathname();
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);
  const hasPublicSidebar = shouldShowPublicSidebar(pathname);
  const hasFixedHeader = shouldOffsetFixedHeader(pathname);
  const hasSiteHeader = shouldShowSiteHeader(pathname);
  const sidebarOffsetClass = isSidebarOpen ? "md:ml-64" : "md:ml-20";

  if (!hasPublicSidebar) {
    return (
      <div
        className={cn(
          "flex min-h-screen flex-col bg-black text-white",
          hasFixedHeader && "pt-16",
        )}
      >
        {hasSiteHeader && <SiteHeader />}
        <main className="flex flex-1 flex-col">{children}</main>
        <OnboardingGate />
        <BackToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 text-white">
      {hasSiteHeader && <SiteHeader />}
      <PublicSidebar />
      <main
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          sidebarOffsetClass,
        )}
      >
        {children}
      </main>
      <OnboardingGate />
      <BackToTop />
    </div>
  );
}
