import { ReactNode } from "react";
import { StaffSidebar } from "@/features/staff/components/staff-sidebar";
import { StaffTopbar } from "@/features/staff/components/staff-topbar";
import { BackofficeThemeProvider } from "@/shared/ui/backoffice-theme-provider";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <BackofficeThemeProvider className="flex h-screen w-full flex-col overflow-hidden bg-[#F8F9FA] font-sans">
      <StaffTopbar />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <StaffSidebar />

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </BackofficeThemeProvider>
  );
}

