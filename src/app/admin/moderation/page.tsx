import type { Metadata } from "next";
import { ModerationManagement } from "@/features/admin/components/moderation-management";

export const metadata: Metadata = {
  title: "Kiểm duyệt Nội dung | Admin",
};

export default function AdminModerationPage() {
  return <ModerationManagement />;
}
