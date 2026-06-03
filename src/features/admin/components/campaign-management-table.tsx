"use client";

import { useState } from "react";
import { GripVertical, Edit2, Trash2 } from "lucide-react";

// Mock Data chuẩn theo thiết kế "Banner & Campaign Management"
const mockCampaigns = [
  {
    id: "CP-2024-001",
    title: "Summer Horizon Series",
    location: "Main Hero",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop",
    dateRange: "Jun 15 - Aug 30",
    statusText: "Active Now",
    statusColor: "text-[#7B42FF]", // Màu tím chuẩn thiết kế
    isActive: true,
  },
  {
    id: "CP-2024-002",
    title: "Retro Collection Launch",
    location: "Main Hero",
    image:
      "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=400&auto=format&fit=crop",
    dateRange: "Sep 01 - Oct 15",
    statusText: "Scheduled",
    statusColor: "text-gray-500",
    isActive: false,
  },
  {
    id: "CP-2024-003",
    title: "Prism Winter Glow",
    location: "Footer Spotlight",
    image: "", // Giả lập ảnh chưa có / đang load
    dateRange: "Nov 20 - Jan 05",
    statusText: "Draft",
    statusColor: "text-gray-500",
    isActive: false,
  },
];

export function CampaignManagementTable() {
  // Trạng thái local để giả lập việc bật/tắt Toggle
  const [campaigns, setCampaigns] = useState(mockCampaigns);

  const toggleStatus = (id: string) => {
    setCampaigns(
      campaigns.map((camp) =>
        camp.id === id ? { ...camp, isActive: !camp.isActive } : camp,
      ),
    );
  };

  return (
    <div className="w-full rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          {/* Table Header */}
          <thead className="bg-white text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-100">
            <tr>
              <th className="px-6 py-5 w-12"></th> {/* Cột cho icon kéo thả */}
              <th className="px-6 py-5">Preview</th>
              <th className="px-6 py-5">Campaign Details</th>
              <th className="px-6 py-5">Duration</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-50">
            {campaigns.map((campaign) => (
              <tr
                key={campaign.id}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                {/* 1. Kéo thả (Drag Handle) */}
                <td className="px-6 py-6 whitespace-nowrap">
                  <GripVertical className="w-5 h-5 text-gray-300 cursor-grab hover:text-gray-500 active:cursor-grabbing transition-colors" />
                </td>

                {/* 2. Preview Ảnh Banner */}
                <td className="px-6 py-6 whitespace-nowrap">
                  <div className="w-32 h-16 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative shadow-sm">
                    {campaign.image ? (
                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200" />
                    )}
                  </div>
                </td>

                {/* 3. Campaign Details */}
                <td className="px-6 py-6 whitespace-nowrap">
                  <h4 className="text-base font-bold text-gray-900 mb-1">
                    {campaign.title}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    ID: {campaign.id} &bull; Location: {campaign.location}
                  </p>
                </td>

                {/* 4. Duration & Status Text */}
                <td className="px-6 py-6 whitespace-nowrap">
                  <p className="text-sm font-bold text-gray-900 mb-1">
                    {campaign.dateRange}
                  </p>
                  <p
                    className={`text-xs font-semibold ${campaign.statusColor}`}
                  >
                    {campaign.statusText}
                  </p>
                </td>

                {/* 5. Status Toggle Switch */}
                <td className="px-6 py-6 whitespace-nowrap">
                  <button
                    onClick={() => toggleStatus(campaign.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#007A8A]/30 focus:ring-offset-2 ${
                      campaign.isActive ? "bg-[#007A8A]" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                        campaign.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>

                {/* 6. Actions (Edit / Delete) */}
                <td className="px-6 py-6 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
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

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50 bg-white">
        <p className="text-xs text-gray-500 font-medium">
          Showing 3 of 12 active campaigns
        </p>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            Previous
          </button>
          <button className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
