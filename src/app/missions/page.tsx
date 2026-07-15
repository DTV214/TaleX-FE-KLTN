import type { Metadata } from "next";
import { MissionCenter } from "@/features/mission/components/mission-center";

export const metadata: Metadata = { title: "Daily Quests | TaleX" };

export default function MissionsPage() {
  return (
    <div className="min-h-screen bg-[#080808] selection:bg-[#d4af37] selection:text-black">
      <div className="container mx-auto max-w-6xl px-4 py-8 md:px-6 lg:py-10">
        <MissionCenter />
      </div>
    </div>
  );
}
