import type { Metadata } from "next";
import { TagManagement } from "@/features/admin/components/tag-management";

export const metadata: Metadata = {
  title: "Quản lý Thẻ | Admin",
};

export default function AdminTagsPage() {
  return <TagManagement />;
}
