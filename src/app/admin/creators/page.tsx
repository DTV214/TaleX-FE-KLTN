import type { Metadata } from "next";
import { CreatorManagement } from "@/features/admin/components/creator-management";

export const metadata: Metadata = {
  title: "Quản lý Người sáng tạo | Admin",
};

export default function AdminCreatorsPage() {
  return <CreatorManagement />;
}
