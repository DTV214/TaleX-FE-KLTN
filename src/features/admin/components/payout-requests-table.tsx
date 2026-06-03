"use client";

import { useState } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Landmark, // Icon cho Bank Transfer
  Wallet, // Icon cho PayPal
  CreditCard, // Icon cho Stripe
} from "lucide-react";

// Định nghĩa Mock Data
const mockPayouts = [
  {
    id: "PO-1001",
    creator: {
      name: "Alex Rivera",
      handle: "@arivera_streams",
      avatar: "https://i.pravatar.cc/150?img=11",
    },
    amount: "$12,450.00",
    method: "Bank Transfer",
    date: "Oct 24, 2023",
  },
  {
    id: "PO-1002",
    creator: {
      name: "Elena Chen",
      handle: "@elena_creates",
      avatar: "https://i.pravatar.cc/150?img=47",
    },
    amount: "$8,200.50",
    method: "PayPal",
    date: "Oct 23, 2023",
  },
  {
    id: "PO-1003",
    creator: {
      name: "Marcus Thorne",
      handle: "@thorne_gaming",
      avatar: "https://i.pravatar.cc/150?img=33",
    },
    amount: "$24,110.00",
    method: "Stripe",
    date: "Oct 22, 2023",
  },
];

// Hàm phụ trợ lấy Icon tương ứng với phương thức thanh toán
const getPaymentIcon = (method: string) => {
  switch (method) {
    case "Bank Transfer":
      return <Landmark className="w-4 h-4 text-teal-600" />;
    case "PayPal":
      return <Wallet className="w-4 h-4 text-blue-500" />;
    case "Stripe":
      return <CreditCard className="w-4 h-4 text-indigo-500" />;
    default:
      return <Landmark className="w-4 h-4 text-gray-500" />;
  }
};

export function PayoutRequestsTable() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="w-full rounded-2xl bg-white shadow-sm border border-gray-100 flex flex-col mt-8">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-gray-50">
        <h2 className="text-xl font-bold text-gray-900">Payout Requests</h2>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Ô Tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by creator name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all"
            />
          </div>

          {/* Nút Filter Thời gian */}
          <button className="flex items-center gap-2 h-10 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full sm:w-auto justify-center whitespace-nowrap">
            <Calendar className="w-4 h-4 text-gray-400" />
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Bảng Dữ Liệu (Responsive Scroll) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50/50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-lg">Creator Name</th>
              <th className="px-6 py-4">Amount ($)</th>
              <th className="px-6 py-4">Payment Method</th>
              <th className="px-6 py-4">Date Requested</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockPayouts.map((payout) => (
              <tr
                key={payout.id}
                className="hover:bg-gray-50/80 transition-colors group"
              >
                {/* Cột 1: Creator */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={payout.creator.avatar}
                      alt={payout.creator.name}
                      className="w-10 h-10 rounded-full border border-gray-200 object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {payout.creator.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {payout.creator.handle}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Cột 2: Amount */}
                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                  {payout.amount}
                </td>

                {/* Cột 3: Payment Method */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(payout.method)}
                    <span className="font-medium text-gray-700">
                      {payout.method}
                    </span>
                  </div>
                </td>

                {/* Cột 4: Date */}
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                  {payout.date}
                </td>

                {/* Cột 5: Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="px-4 py-2 bg-[#7B42FF] text-white text-xs font-bold rounded-md hover:bg-[#6528F7] transition-colors shadow-sm">
                      Process Payout
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm">
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
        <p className="text-xs text-gray-500">
          Showing <span className="font-medium text-gray-900">1-10</span> of{" "}
          <span className="font-medium text-gray-900">42</span> payout requests
        </p>
        <div className="flex items-center gap-1">
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-md bg-[#007A8A] text-white text-sm font-medium shadow-sm transition-colors">
            1
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            2
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            3
          </button>

          <button className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
