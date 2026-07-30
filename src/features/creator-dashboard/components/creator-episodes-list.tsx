import React from "react";
import { Plus, Edit3, Trash2, ListVideo, PlayCircle, Clock } from "lucide-react";
import { CreatorBackButton } from "@/features/creator-dashboard/components/creator-back-button";

interface CreatorEpisodesListProps {
  episodes: any[];
  onSelect: (episodeId: string) => void;
  onCreate: () => void;
  onEdit: (episode: any) => void;
  onDelete: (episode: any) => void;
  onBack: () => void;
}

export function CreatorEpisodesList({
  episodes,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
  onBack,
}: CreatorEpisodesListProps) {
  return (
    <div className="w-full py-6 text-creator-text">
      <div className="mb-8 flex flex-col justify-between gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:flex-row md:items-end">
        <div>
          <CreatorBackButton onClick={onBack} className="mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Số tập</h2>
          <p className="text-creator-muted">
            Chọn một tập để quản lý nội dung, hoặc thêm tập mới.
          </p>
        </div>
        <button
          onClick={onCreate}
          className="creator-shine-card flex shrink-0 items-center gap-2 rounded-2xl bg-creator-gold px-6 py-3 text-sm font-bold text-black shadow-[0_16px_40px_rgba(212,175,55,0.16)] transition-all hover:-translate-y-0.5 hover:bg-creator-gold-hover"
        >
          <Plus size={18} /> Thêm Tập Mới
        </button>
      </div>

      {episodes.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-creator-gold/25 bg-white/[0.03] p-16 text-center shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-creator-gold/20 bg-creator-gold/10">
            <ListVideo size={40} className="text-creator-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">
            Không tìm thấy tập nào
          </h3>
          <p className="text-creator-muted max-w-md mb-8">
            Mùa này chưa có tập nào. Bấm vào nút bên dưới để thêm tập mới.
          </p>
          <button
            onClick={onCreate}
            className="creator-shine-card flex items-center gap-2 rounded-2xl bg-creator-gold px-6 py-3 text-sm font-bold text-black transition-all hover:-translate-y-0.5 hover:bg-creator-gold-hover"
          >
            <Plus size={18} /> Thêm Tập Mới
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {episodes.map((episode) => (
            <div
              key={episode.id}
              className="creator-shine-card group flex cursor-pointer items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.035] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-creator-gold/45 hover:bg-white/[0.055]"
              onClick={() => onSelect(episode.id)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-creator-gold/20 bg-creator-gold/10">
                  <PlayCircle
                    size={20}
                    className="text-creator-muted group-hover:text-creator-gold transition-colors"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-creator-gold">
                      EP{" "}
                      {episode.episodeNumber < 10
                        ? `0${episode.episodeNumber}`
                        : episode.episodeNumber}
                    </span>
                    <h3 className="text-lg font-bold text-white">{episode.title}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        episode.status === "PUBLISHED"
                          ? "bg-green-500/20 text-green-500 border border-green-500/20"
                          : episode.status === "DRAFT"
                            ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20"
                            : "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                      }`}
                    >
                      {episode.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-creator-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {episode.duration || "00:00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(episode);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-creator-gold hover:text-black"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(episode);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white transition-colors hover:bg-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
