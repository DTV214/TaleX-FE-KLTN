import type { Metadata } from "next";
import { MissionCenter } from "@/features/mission/components/mission-center";

export const metadata: Metadata = { title: "Daily Quests | TaleX" };

export default function MissionsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E10] selection:bg-[#d4af37] selection:text-black">
      <div className="container mx-auto max-w-[1440px] px-6 py-12 md:px-12 md:py-24">
        <MissionCenter />
      </div>
    </div>
  );
}
