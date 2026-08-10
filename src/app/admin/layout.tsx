import { ReactNode } from "react";
import { AdminGuard } from "@/features/admin/components/admin-guard";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { AdminTopbar } from "@/features/admin/components/admin-topbar";
import { BackofficeThemeProvider } from "@/shared/ui/backoffice-theme-provider";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <BackofficeThemeProvider className="flex h-screen w-full flex-col overflow-hidden bg-[#F8F9FA] font-sans">
        <AdminTopbar />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <AdminSidebar />

          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </BackofficeThemeProvider>
    </AdminGuard>
  );
}
