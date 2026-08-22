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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 backoffice-dark:text-white">
            Quản Lý Xu Thưởng
          </h1>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm backoffice-dark:border-white/10 backoffice-dark:bg-white/[0.04] sm:p-8">
        <div className="mb-7 border-b border-gray-100 pb-5 backoffice-dark:border-white/10">
          <h2 className="text-xl font-bold text-gray-900 backoffice-dark:text-white">
            Cấu hình phần thưởng
          </h2>
        </div>

        <CoinEconomyForm />
      </section>
    </div>
  );
}
