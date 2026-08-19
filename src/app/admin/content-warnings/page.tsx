import type { Metadata } from "next";
import { ContentWarningCategoryManagement } from "@/features/admin/components/content-warning-category-management";

export const metadata: Metadata = {
  title: "Cảnh báo nội dung | Admin",
};

export default function AdminContentWarningsPage() {
  return <ContentWarningCategoryManagement />;
}
