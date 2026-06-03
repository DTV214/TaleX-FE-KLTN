"use client";

import { useState } from "react";
import { Search, ChevronDown, Edit2, Trash2, Library } from "lucide-react";

const mockComics = [
  {
    id: "COM-801",
    title: "Tower of Sky",
    author: "Studio Mirai",
    cover:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=200&auto=format&fit=crop",
    chapters: 154,
    rating: "4.9/5",
    status: "Ongoing",
  },
  {
    id: "COM-802",
    title: "Second Life",
    author: "Elena V.",
    cover:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=200&auto=format&fit=crop",
    chapters: 92,
    rating: "4.7/5",
    status: "Ongoing",
  },
  {
    id: "COM-803",
    title: "The Last Promise",
    author: "Kenji Arts",
    cover:
      "https://images.unsplash.com/photo-1499092346589-b9b6be3e94b2?q=80&w=200&auto=format&fit=crop",
    chapters: 200,
    rating: "4.9/5",
    status: "Completed",
  },
];

export function ComicManagementTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full flex flex-col gap-6 mt-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search comics by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007A8A]/20 focus:border-[#007A8A] transition-all shadow-sm"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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
                <th className="px-6 py-4">Comic Details</th>
                <th className="px-6 py-4">Total Chapters</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockComics.map((comic) => (
                <tr
                  key={comic.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-4">
                      {/* Dùng tỷ lệ dọc (portrait) đặc trưng của bìa truyện tranh */}
                      <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0 group-hover:shadow-md transition-all">
                        <img
                          src={comic.cover}
                          alt={comic.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">
                          {comic.title}
                        </p>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                          Author: {comic.author}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                    {comic.chapters}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-[#F5A623]">
                    {comic.rating}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${
                        comic.status === "Ongoing"
                          ? "bg-[#E5FAFF] text-[#00D1FF]"
                          : "bg-[#F3F0FF] text-[#7B42FF]"
                      }`}
                    >
                      {comic.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 text-gray-400 hover:text-[#007A8A] rounded-lg hover:bg-[#E6F6F4] transition-colors"
                        title="Manage Chapters"
                      >
                        <Library className="w-4 h-4" />
                      </button>
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
