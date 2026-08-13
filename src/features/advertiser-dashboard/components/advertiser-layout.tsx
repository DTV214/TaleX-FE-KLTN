import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreditCard, LayoutDashboard, LogOut, BarChart2, Megaphone, PlusCircle, Home } from "lucide-react";
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
    <div className="flex h-screen w-full bg-[#F8F8F8] text-[#161823]">
      {/* Global Sidebar Wrapper to hold space */}
      <div className="w-16 shrink-0 relative z-50 h-full">
        {/* The Actual Sidebar (Expands as overlay) */}
        <div className="group absolute top-0 left-0 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 w-16 hover:w-64 hover:shadow-xl overflow-hidden">
          <div className="flex h-14 shrink-0 items-center justify-center border-b border-slate-200 group-hover:justify-start group-hover:px-4">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.png" alt="TaleX Logo" className="h-7 w-auto object-contain shrink-0" />
              <span className="font-heading text-xl font-bold tracking-tight text-[#161823] opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden group-hover:block whitespace-nowrap">
                TaleX
              </span>
            </Link>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden py-4 text-sm font-medium">
            <div className="px-2">
              <Link href="/advertiser-dashboard?view=dashboard" className={`flex items-center gap-3 rounded-md p-2 hover:bg-slate-100 ${activeView === 'dashboard' ? 'bg-slate-100 text-[#161823] font-bold' : 'text-slate-500 hover:text-[#161823]'}`}>
                <LayoutDashboard className={`h-5 w-5 shrink-0 ${activeView === 'dashboard' ? 'text-[#161823]' : ''}`} />
                <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">Dashboard</span>
              </Link>
            </div>
            
            <div className="px-2">
              <Link href="/advertiser-dashboard?view=campaigns" className={`flex items-center gap-3 rounded-md p-2 hover:bg-slate-100 ${activeView === 'campaigns' ? 'bg-slate-100 text-[#161823] font-bold' : 'text-slate-500 hover:text-[#161823]'}`}>
                <Megaphone className={`h-5 w-5 shrink-0 ${activeView === 'campaigns' ? 'text-[#161823]' : ''}`} />
                <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">Campaigns</span>
              </Link>
            </div>

            <div className="px-2">
              <Link href="/advertiser-dashboard?view=wallet" className={`flex items-center gap-3 rounded-md p-2 hover:bg-slate-100 ${activeView === 'wallet' ? 'bg-slate-100 text-[#161823] font-bold' : 'text-slate-500 hover:text-[#161823]'}`}>
                <CreditCard className={`h-5 w-5 shrink-0 ${activeView === 'wallet' ? 'text-[#161823]' : ''}`} />
                <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">Ví tiền</span>
              </Link>
            </div>


            <div className="px-2 mt-4 pt-4 border-t border-slate-200">
              <Link href="/" className="flex items-center gap-3 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#161823] cursor-pointer group">
                <Home className="h-5 w-5 shrink-0" />
                <span className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 whitespace-nowrap">Quay về trang chủ</span>
              </Link>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between bg-white px-6 border-b border-slate-200 z-10">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-[#161823]">Ads Manager</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-sm hidden sm:block">
              <span className="text-slate-400">Account: </span>
              <span className="font-semibold">{displayName}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#161823]"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:block">Log out</span>
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-[#F8F8F8]">
            {children}
          </main>
        </div>
    </div>
    </div>
  );
}
