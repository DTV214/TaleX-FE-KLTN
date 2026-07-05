import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Film,
  BarChart2,
  DollarSign,
  Settings,
  Bell,
  Search,
  User,
  LogOut,
  Clapperboard,
  Tag,
} from "lucide-react";
import { useAuthStore } from "@/features/auth/store/auth.store";

interface CreatorLayoutProps {
  children: React.ReactNode;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export function CreatorLayout({ children, activeView, onNavigate }: CreatorLayoutProps) {
  const logout = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);

  const navItems = [
    { label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
    { label: "My Series", view: "series", icon: Film },
    { label: "Analytics", view: "analytics", icon: BarChart2 },
    { label: "Revenue", view: "revenue", icon: DollarSign },
    { label: "Production", view: "production", icon: Clapperboard },
    { label: "Combo Management", view: "combos", icon: Tag },
  ];

  return (
    <div className="flex h-screen bg-creator-bg text-creator-text font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-creator-sidebar flex flex-col border-r border-creator-border flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-creator-border">
          <span className="text-xl font-bold tracking-wider text-creator-gold">TaleX <span className="text-white">Studio</span></span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => {
              // Basic active state logic
              const isActive = activeView === item.view || (item.view === 'series' && activeView === 'create');
              
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate && onNavigate(item.view)}
                  className={`flex items-center w-full gap-3 px-4 py-3 rounded-md transition-colors ${
                    isActive 
                      ? "bg-creator-gold/10 text-creator-gold font-medium" 
                      : "text-creator-muted hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={18} className={isActive ? "text-creator-gold" : "text-creator-muted"} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t border-creator-border">
          <button className="flex items-center gap-3 px-4 py-3 rounded-md text-creator-muted hover:text-white hover:bg-white/5 transition-colors w-full text-left">
            <Settings size={18} />
            Settings
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-md text-creator-muted hover:text-white hover:bg-white/5 transition-colors w-full text-left mt-1"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 border-b border-creator-border bg-creator-bg/95 backdrop-blur-sm flex items-center justify-between px-8 flex-shrink-0 z-10 sticky top-0">
          <div className="flex items-center max-w-md w-full relative">
            <Search className="absolute left-3 text-creator-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search in your studio..." 
              className="w-full bg-creator-card border border-creator-border rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-creator-muted focus:outline-none focus:border-creator-gold transition-colors"
            />
          </div>

          <div className="flex items-center gap-6">
            <button className="text-creator-muted hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-creator-bg"></span>
            </button>
            <div className="flex items-center gap-3 cursor-pointer pl-6 border-l border-creator-border">
              <div className="w-8 h-8 rounded-full bg-creator-gold/20 flex items-center justify-center text-creator-gold overflow-hidden">
                {(user as any)?.avatarUrl ? (
                  <img src={(user as any).avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{(user as any)?.username || "Creator"}</span>
                <span className="text-xs text-creator-muted">Pro Publisher</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#13110F]">
          {children}
        </main>
      </div>
    </div>
  );
}
