import type { Metadata } from "next";
import { ContentPurchaseHistory } from "@/features/payment/components/content-purchase-history";

export const metadata: Metadata = {
  title: "Lịch sử mua nội dung | TaleX",
  description: "Theo dõi lịch sử các Episode và Combo đã mua trên TaleX.",
};

export default function PurchaseHistoryPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080808]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_14%_6%,rgba(125,211,252,0.12),transparent_32%),radial-gradient(circle_at_90%_8%,rgba(212,175,55,0.08),transparent_30%),linear-gradient(135deg,#080808_0%,#111114_52%,#080808_100%)]" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 lg:py-10">
        <ContentPurchaseHistory />
      </div>
    </div>
  );
}
