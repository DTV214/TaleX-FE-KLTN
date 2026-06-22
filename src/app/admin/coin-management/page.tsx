import type { Metadata } from "next";
import { CircleDollarSign } from "lucide-react";
import { CoinEconomyForm } from "@/features/admin/coin-management";

export const metadata: Metadata = {
  title: "Quản Lý Nền Kinh Tế Coin | TaleX Admin",
  description: "Quản lý phần thưởng điểm danh và các mốc coin của TaleX.",
};

export default function AdminCoinManagementPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#E6F7F9] text-[#007A8A]">
          <CircleDollarSign className="h-6 w-6" />
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-gray-500">
            Admin / Coin Economy
          </p>
          <h1 className="font-heading text-3xl font-bold text-gray-900">
            Quản Lý Nền Kinh Tế Coin
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Thiết lập phần thưởng điểm danh và kiểm soát các mốc tích lũy coin.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-7 border-b border-gray-100 pb-5">
          <h2 className="font-heading text-xl font-bold text-gray-900">
            Cấu hình phần thưởng
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Giá trị các mốc phải tăng dần để đảm bảo cơ chế khuyến khích hợp lý.
          </p>
        </div>

        <CoinEconomyForm />
      </section>
    </div>
  );
}
