"use client";

import { Plus, Video } from "lucide-react";
import { VideoManagementTable } from "@/features/admin/components/video-management-table";

export default function VideoContentPage() {
  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Video Content
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Manage movies, series, and animated shorts across the platform.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#7B42FF] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#6528F7] hover:shadow-md active:scale-95 whitespace-nowrap">
          <Plus className="h-5 w-5" />
          Upload Video
        </button>
      </div>

      <VideoManagementTable />
    </div>
  );
}
