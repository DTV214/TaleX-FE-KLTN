"use client";

import { Search, Bell, HelpCircle } from "lucide-react";

export function AdminTopbar() {
  return (
    <header className="sticky top-0 z-40 flex h-20 w-full items-center justify-between bg-white px-8 border-b border-gray-100">
      {/* Global Search */}
      <div className="flex w-full max-w-xl items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Global search users, content, or transaction IDs..."
            className="h-11 w-full rounded-full bg-gray-50 pl-12 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] transition-all border border-transparent"
          />
        </div>
      </div>

      {/* Right Utilities */}
      <div className="flex items-center gap-4 ml-auto">
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="ml-2 h-8 w-px bg-gray-200" /> {/* Divider */}
        <button className="flex items-center gap-2 ml-2 pl-2">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-gray-200">
            <img
              src="https://i.pravatar.cc/150?img=33"
              alt="Admin Avatar"
              className="h-full w-full object-cover"
            />
          </div>
        </button>
      </div>
    </header>
  );
}
