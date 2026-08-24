import type { Metadata } from "next";
import { SubscriptionRevenueSharingDashboard } from "@/features/admin/subscription-revenue-sharing/components/subscription-revenue-sharing-dashboard";

export const metadata: Metadata = {
  title: "Quản lý chia tiền Creator | TaleX Admin",
  description:
    "Theo dõi và tính thử phân chia doanh thu subscription cho creator.",
};

export default function AdminSubscriptionRevenueSharingPage() {
  return <SubscriptionRevenueSharingDashboard />;
}
