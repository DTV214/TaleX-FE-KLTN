import type { Metadata } from "next";
import { ViolationLabelTranslationManagement } from "@/features/admin/components/violation-label-translation-management";

export const metadata: Metadata = {
  title: "Nhãn kiểm duyệt | Admin",
};

export default function AdminViolationLabelsPage() {
  return <ViolationLabelTranslationManagement />;
}
