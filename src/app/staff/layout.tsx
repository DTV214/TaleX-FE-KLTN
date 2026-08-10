import { ReactNode } from "react";
import { StaffSidebar } from "@/features/staff/components/staff-sidebar";
import { StaffTopbar } from "@/features/staff/components/staff-topbar";
import { BackofficeThemeProvider } from "@/shared/ui/backoffice-theme-provider";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <BackofficeThemeProvider className="flex min-h-screen w-full bg-[#F8F9FA] font-sans">
      <StaffSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <StaffTopbar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </BackofficeThemeProvider>
  );
}
