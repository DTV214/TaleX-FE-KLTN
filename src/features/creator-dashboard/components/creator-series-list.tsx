import React, { useState, useMemo } from "react";
import { Plus, Edit3, Trash2, Eye, Film, Layers, Search, Filter } from "lucide-react";

interface CreatorSeriesListProps {
  seriesList: any[];
  onSelect: (seriesId: string) => void;
  onCreate: () => void;
  onEdit: (series: any) => void;
  onDelete: (series: any) => void;
}

export function CreatorSeriesList({ seriesList, onSelect, onCreate, onEdit, onDelete }: CreatorSeriesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredSeries = useMemo(() => {
    return seriesList.filter((series) => {
      const matchesSearch = series.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === "ALL" || series.contentType === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [seriesList, searchQuery, filterType]);

  return (
    <div className="w-full py-6 text-creator-text">
      <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)] md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="creator-spotlight-text mb-2 text-3xl font-bold text-white">Series của tôi</h2>
          <p className="text-creator-muted">Quản lý series, mùa và tập của bạn.</p>
        </div>
        <button
          onClick={onCreate}
          className="creator-shine-card flex shrink-0 items-center gap-2 rounded-2xl bg-creator-gold px-6 py-3 text-sm font-black text-black shadow-[0_16px_40px_rgba(226,177,60,0.18)] transition-all hover:-translate-y-0.5 hover:bg-creator-gold-hover"
        >
          <Plus size={18} /> Tạo Series Mới
        </button>
      </div>

      <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur-sm sm:flex-row">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-creator-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm series theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/[0.045] py-3 pl-10 pr-4 text-sm text-white outline-none transition-colors placeholder:text-creator-muted focus:border-creator-gold/70"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Filter size={18} className="text-creator-muted hidden sm:block" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="creator-format-select w-full cursor-pointer rounded-xl border border-white/10 bg-[#121214] px-4 py-3 text-sm font-semibold text-white outline-none transition-colors [color-scheme:dark] hover:border-creator-gold/40 focus:border-creator-gold/70 sm:w-auto"
          >
            <option value="ALL">Tất cả định dạng</option>
            <option value="COMIC">Truyện tranh</option>
            <option value="VIDEO">Phim ngắn</option>
          </select>
        </div>
      </div>

      {filteredSeries.length === 0 ? (
        <div className="creator-shine-card mt-8 flex flex-col items-center justify-center rounded-[28px] border border-dashed border-creator-gold/30 bg-white/[0.035] p-16 text-center shadow-[0_24px_70px_rgba(0,0,0,0.2)]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/40">
            <Film size={40} className="text-creator-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Series Found</h3>
          <p className="text-creator-muted max-w-md mb-8">
            {seriesList.length > 0
              ? "No series match your search and filter criteria."
              : "You haven't created any series yet. Start building your universe by creating your first series."}
          </p>
          {seriesList.length === 0 && (
            <button
              onClick={onCreate}
              className="creator-shine-card flex items-center gap-2 rounded-2xl bg-creator-gold px-6 py-3 text-sm font-black text-black transition-colors hover:bg-creator-gold-hover"
            >
              <Plus size={18} /> Tạo Series Mới
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredSeries.map((series) => (
            <div
              key={series.id}
              className="creator-shine-card group flex cursor-pointer flex-col overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.035] shadow-[0_22px_70px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-1 hover:border-creator-gold/45 hover:bg-white/[0.055]"
              onClick={() => onSelect(series.id)}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-white/10 bg-black/45">
                {series.coverUrl ? (
                  <img src={series.coverUrl} alt={series.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={40} className="text-creator-muted/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(series); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-creator-gold hover:text-black"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(series); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white transition-colors hover:bg-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${series.status === "PUBLISHED" ? "bg-green-500/20 text-green-500 border border-green-500/20" :
                    series.status === "DRAFT" ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20" :
                      "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                    }`}>
                    {series.status}
                  </span>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{series.title}</h3>
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-between p-4">
                <p className="text-sm text-creator-muted line-clamp-2 mb-4">{series.description || "No description provided."}</p>
                <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs font-medium text-creator-muted">
                  <span className="flex items-center gap-1.5"><Layers size={14} /> {series.contentType === "COMIC" ? "Comic" : "Video"}</span>
                  <span className="flex items-center gap-1.5"><Eye size={14} /> {series.views || "0"} Views</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
