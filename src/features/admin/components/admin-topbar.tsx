"use client";

import Link from "next/link";
import { Search, Bell, HelpCircle, Menu } from "lucide-react";
import { useAdminSidebarStore } from "./admin-sidebar";

export function AdminTopbar() {
  const toggleSidebar = useAdminSidebarStore((state) => state.toggleSidebar);

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white px-4 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Toggle admin sidebar"
          title="Toggle admin sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]/40"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link
          href="/admin/dashboard"
          className="group flex min-w-fit items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#00D1FF]/40"
          aria-label="TaleX Admin Dashboard"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://res.cloudinary.com/dratbz8bh/image/upload/v1783173753/1-removebg-preview_xv2wde.png"
            alt="TaleX Admin Logo"
            className="h-12 w-auto max-w-[160px] object-contain"
          />
        </Link>
      </div>

      <div className="mx-6 hidden w-full max-w-xl items-center lg:flex">
        <div className="relative w-full">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Global search users, content, or transaction IDs..."
            className="h-11 w-full rounded-full border border-transparent bg-gray-50 pl-12 pr-4 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-[#00D1FF] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00D1FF]/20"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Help"
          className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="ml-1 h-8 w-px bg-gray-200" />
        <button type="button" className="flex items-center gap-2 pl-1">
          <span className="h-9 w-9 overflow-hidden rounded-full border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.pravatar.cc/150?img=33"
              alt="Admin Avatar"
              className="h-full w-full object-cover"
            />
          </span>
        </button>
      </div>
    </header>
  );
}
