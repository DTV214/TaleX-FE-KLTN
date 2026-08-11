import type { Metadata } from "next";
import { TaxConfigDashboard } from "@/features/admin/tax-config/components/tax-config-dashboard";

export const metadata: Metadata = {
  title: "Thuế | Admin",
};

export default function AdminTaxConfigPage() {
  return <TaxConfigDashboard />;
}
