import type { Metadata } from "next";
import { AdminSeriesManagement } from "@/features/admin/components/admin-series-management";

export const metadata: Metadata = {
  title: "Quản lý Tác phẩm | Admin",
};

export default function AdminSeriesPage() {
  return <AdminSeriesManagement />;
}
