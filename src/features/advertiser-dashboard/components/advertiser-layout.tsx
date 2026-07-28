import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Megaphone,
  CreditCard,
  BarChart2,
  LogOut,
  Home,
  PlusCircle,
} from "lucide-react";
import { logoutAction } from "@/features/auth/api/auth.actions";
import { isFullProfile, useAuthStore } from "@/features/auth/store/auth.store";

interface AdvertiserLayoutProps {
  children: React.ReactNode;
  activeView?: string;
}

export function AdvertiserLayout({
  children,
  activeView = "dashboard",
}: AdvertiserLayoutProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const profileUser = isFullProfile(user) ? user : null;
  const displayName = profileUser?.username || user?.accountId || "Advertiser";

  const navItems = [
    { label: "Tổng quan", view: "dashboard", icon: LayoutDashboard, path: "/advertiser-dashboard" },
    { label: "Chiến dịch của tôi", view: "campaigns", icon: Megaphone, path: "/advertiser-dashboard?view=campaigns" },
    { label: "Tạo chiến dịch", view: "create", icon: PlusCircle, path: "/advertiser-dashboard?view=create" },
    { label: "Ví & Nạp tiền", view: "wallet", icon: CreditCard, path: "/advertiser-dashboard?view=wallet" },
    { label: "Thống kê", view: "analytics", icon: BarChart2, path: "/advertiser-dashboard?view=analytics" },
  ];

  const handleLogout = async () => {
    await logoutAction();
    clearAuth();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen w-full bg-[#111113] text-slate-200">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-white/10 bg-[#1a1a1c] lg:flex">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 text-[#D4AF37] hover:opacity-80">
            <Megaphone className="h-6 w-6" />
            <span className="font-bold text-lg">TaleX Ads</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-4">
            {navItems.map((item) => (
              <Link
                key={item.view}
                href={item.path}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeView === item.view
                    ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#D4AF37]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs text-slate-400">Advertiser</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#1a1a1c] px-6">
          <h1 className="text-xl font-bold text-white">
            {navItems.find((item) => item.view === activeView)?.label || "Advertiser Dashboard"}
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 bg-[#111113]">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
