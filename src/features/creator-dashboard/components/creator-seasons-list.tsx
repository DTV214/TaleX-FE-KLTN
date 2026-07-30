import React from "react";
import { Plus, Edit3, Trash2, Layers } from "lucide-react";
import { CreatorBackButton } from "@/features/creator-dashboard/components/creator-back-button";

interface CreatorSeasonsListProps {
  seasons: any[];
  onSelect: (seasonId: string) => void;
  onCreate: () => void;
  onEdit: (season: any) => void;
  onDelete: (season: any) => void;
  onBack: () => void;
}

export function CreatorSeasonsList({
  seasons,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onBack,
}: CreatorSeasonsListProps) {
  return (
    <div className="w-full py-6 text-creator-text">
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:flex-row md:items-end">
        <div>
          <CreatorBackButton onClick={onBack} className="mb-6" />
          <h2 className="creator-spotlight-text mb-2 text-3xl font-bold text-white">Mùa</h2>
          <p className="text-creator-muted">
            Chọn một mùa để quản lý các tập, hoặc tạo mùa mới.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="creator-shine-card flex shrink-0 items-center gap-2 rounded-2xl bg-creator-gold px-6 py-3 text-sm font-bold text-black shadow-[0_16px_40px_rgba(212,175,55,0.16)] transition-all hover:-translate-y-0.5 hover:bg-creator-gold-hover"
        >
          <Plus size={18} /> Tạo Mùa Mới
        </button>
      </div>

      {seasons.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-creator-gold/25 bg-white/[0.03] p-16 text-center shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-creator-gold/20 bg-creator-gold/10">
            <Layers size={40} className="text-creator-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">
            Không tìm thấy mùa nào
          </h3>
          <p className="mb-6 text-sm text-creator-muted max-w-sm text-center">
            Series này chưa có mùa nào. Bấm vào nút bên dưới để thêm mùa mới.
          </p>
          <button
            onClick={onCreate}
            className="creator-shine-card flex items-center gap-2 rounded-2xl bg-creator-gold px-6 py-3 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-creator-gold-hover"
          >
            <Plus size={18} /> Tạo Mùa Mới
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {seasons.map((season) => (
            <div
              key={season.id}
              className="creator-shine-card group flex cursor-pointer items-center justify-between rounded-[26px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-creator-gold/45 hover:bg-white/[0.055]"
              onClick={() => onSelect(season.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-creator-gold/25 bg-creator-gold/10 shadow-inner">
                  <span className="text-xl font-bold text-creator-gold">
                    {season.seasonNumber}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">{season.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        season.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-500 border border-green-500/20"
                          : season.status === "DRAFT"
                            ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20"
                            : "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                      }`}
                    >
                      {season.status}
                    </span>
                  </div>
                  <p className="text-sm text-creator-muted max-w-xl line-clamp-2">
                    {season.description || "Chưa có mô tả."}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(season);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-creator-gold hover:text-black"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(season);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
