"use client";

import { useState } from "react";
import { Search, ChevronDown, Edit2, Trash2, PlayCircle } from "lucide-react";

const mockVideos = [
  {
    id: "VID-001",
    title: "Cyber Edge: Neon City",
    genre: "Sci-Fi Action",
    thumbnail:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=200&auto=format&fit=crop",
    uploadDate: "Oct 24, 2023",
    views: "1.2M",
    status: "Published",
  },
  {
    id: "VID-002",
    title: "The Silent Watcher",
    genre: "Psychological Thriller",
    thumbnail:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=200&auto=format&fit=crop",
    uploadDate: "Nov 12, 2023",
    views: "850K",
    status: "Published",
  },
  {
    id: "VID-003",
    title: "Arcane Secrets - Ep 1",
    genre: "Fantasy Animation",
    thumbnail:
      "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=200&auto=format&fit=crop",
    uploadDate: "Jan 05, 2024",
    views: "-",
    status: "Draft",
  },
];

export function VideoManagementTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos by title or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            All Genres
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
          <button className="flex h-11 items-center justify-between gap-2 w-full md:w-40 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            Status
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Video Details</th>
                <th className="px-6 py-4">Upload Date</th>
                <th className="px-6 py-4">Total Views</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockVideos.map((video) => (
                <tr
                  key={video.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 group-hover:shadow-md transition-all">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {video.title}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                          {video.genre} • ID: {video.id}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">
                    {video.uploadDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                    {video.views}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${
                        video.status === "Published"
                          ? "bg-[#E6F6F4] text-[#00A389]"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {video.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-[#7B42FF] rounded-lg hover:bg-[#F3F0FF] transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
