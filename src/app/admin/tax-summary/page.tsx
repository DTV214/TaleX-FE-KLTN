import type { Metadata } from "next";
import { AdminTaxReportsView } from "@/features/admin/components/admin-tax-reports-view";

export const metadata: Metadata = {
  title: "Tax & Settlement | Admin Panel",
  description: "Quản lý tổng quan nghĩa vụ thuế VAT, PIT và các báo cáo đối soát chi tiết dành cho Admin.",
};

export default function AdminTaxSummaryPage() {
  return <AdminTaxReportsView />;
}
