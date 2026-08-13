import type { Metadata } from "next";
import { AdminSettlementsDashboard } from "@/features/creator-settlements/components/admin-settlements-dashboard";

export const metadata: Metadata = {
  title: "Quyết toán Creator | Admin",
};

export default function FinancialsPage() {
  return <AdminSettlementsDashboard />;
}
