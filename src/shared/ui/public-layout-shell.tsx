"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { usePublicSidebarStore } from "@/shared/stores/public-sidebar.store";
import { cn } from "@/shared/utils/utils";
import { BackToTop } from "@/shared/ui/back-to-top";
import { PublicSidebar } from "@/shared/ui/public-sidebar";
import { SiteHeader } from "@/shared/ui/site-header";

type PublicLayoutShellProps = {
  children: ReactNode;
};

const sidebarRoutes = ["/", "/series", "/comics", "/intro"] as const;
const hiddenChromeRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/complete-profile",
  "/creator-dashboard",
  "/admin",
  "/staff",
] as const;

function shouldShowPublicSidebar(pathname: string) {
  return sidebarRoutes.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

function shouldOffsetFixedHeader(pathname: string) {
  return !hiddenChromeRoutes.some((route) => pathname.startsWith(route));
}

export function PublicLayoutShell({ children }: PublicLayoutShellProps) {
  const pathname = usePathname();
  const isSidebarOpen = usePublicSidebarStore((state) => state.isSidebarOpen);
  const hasPublicSidebar = shouldShowPublicSidebar(pathname);
  const hasFixedHeader = shouldOffsetFixedHeader(pathname);
  const sidebarOffsetClass = isSidebarOpen ? "md:ml-64" : "md:ml-20";

  if (!hasPublicSidebar) {
    return (
      <div
        className={cn(
          "flex min-h-screen flex-col bg-black text-white",
          hasFixedHeader && "pt-16",
        )}
      >
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <BackToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16 text-white">
      <SiteHeader />
      <PublicSidebar />
      <main
        className={cn(
          "min-w-0 flex-1 transition-all duration-300 ease-in-out",
          sidebarOffsetClass,
        )}
      >
        {children}
      </main>
      <BackToTop />
    </div>
  );
}
