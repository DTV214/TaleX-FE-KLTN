import type { Metadata } from "next";
import { MissionCenter } from "@/features/mission/components/mission-center";

export const metadata: Metadata = {
  title: "Trung Tâm Nhiệm Vụ | TaleX",
  description:
    "Theo dõi tiến độ, hoàn thành nhiệm vụ hằng ngày và nhận thưởng Coin trên TaleX.",
};

export default function MissionsPage() {
  return (
    <div className="container mx-auto max-w-7xl px-4 py-12">
      <header className="mb-10 max-w-3xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37]">
          Thử thách hằng ngày
        </p>
        <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-white md:text-5xl">
          Trung Tâm Nhiệm Vụ
        </h1>
        <p className="mt-4 text-base font-medium leading-7 text-white/55 md:text-lg">
          Hoàn thành thử thách mỗi ngày, theo dõi tiến độ và tích lũy Coin
          để mở khóa thêm nhiều trải nghiệm trên TaleX.
        </p>
      </header>

      <MissionCenter />
    </div>
  );
}
