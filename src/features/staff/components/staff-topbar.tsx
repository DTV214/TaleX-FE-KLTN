"use client";

import { Search, Bell, Moon, Sun } from "lucide-react";
import { useBackofficeTheme } from "@/shared/ui/backoffice-theme-provider";

export function StaffTopbar() {
  const { isDark, toggleTheme } = useBackofficeTheme();

  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between bg-white px-8 border-b border-gray-100">
      {/* Global Search cho Task/Ticket */}
      <div className="flex w-full max-w-xl items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for Report ID, User ID, or Content..."
            className="h-11 w-full rounded-full bg-gray-50 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all border border-transparent"
          />
        </div>
      </div>

      {/* Right Utilities */}
      <div className="flex items-center gap-4 ml-auto">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          title={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
          className="backoffice-theme-toggle inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-xs font-black transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/35"
        >
          <span className="backoffice-theme-toggle-icon inline-flex h-5 w-5 items-center justify-center rounded-full">
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </span>
          <span className="hidden sm:inline">{isDark ? "Sáng" : "Tối"}</span>
        </button>
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>
        <div className="ml-2 h-8 w-px bg-gray-200" /> {/* Divider */}
        <button className="flex items-center gap-3 ml-2 pl-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-900 leading-tight">
              Sarah Chen
            </p>
            <p className="text-[11px] text-gray-500 font-medium">
              Lead Moderator
            </p>
          </div>
          <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100">
            <img
              src="https://i.pravatar.cc/150?img=32"
              alt="Staff Avatar"
              className="h-full w-full object-cover"
            />
          </div>
        </button>
      </div>
    </header>
  );
}
