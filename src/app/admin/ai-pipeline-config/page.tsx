import type { Metadata } from "next";
import { AiPipelineConfigManagement } from "@/features/admin/components/ai-pipeline-config-management";

export const metadata: Metadata = {
  title: "Cấu hình AI Pipeline | Admin",
};

export default function AdminAiPipelineConfigPage() {
  return <AiPipelineConfigManagement />;
}
