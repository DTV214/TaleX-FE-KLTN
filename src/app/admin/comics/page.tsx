"use client";

import { Plus } from "lucide-react";
import { ComicManagementTable } from "@/features/admin/components/comic-management-table";

export default function ComicContentPage() {
  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Comic Collection
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Manage webtoons, manga series, and chapter updates.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#007A8A] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#006673] hover:shadow-md active:scale-95 whitespace-nowrap">
          <Plus className="h-5 w-5" />
          Add New Comic
        </button>
      </div>

      <ComicManagementTable />
    </div>
  );
}
