import type { Metadata } from "next";
import { CategoryManagement } from "@/features/admin/components/category-management";

export const metadata: Metadata = {
  title: "Quản lý Thể loại | Admin",
};

export default function AdminCategoriesPage() {
  return <CategoryManagement />;
}
