import React from "react";
import { Plus, Edit3, Trash2, ListVideo, Layers } from "lucide-react";

interface CreatorSeasonsListProps {
  seasons: any[];
  onSelect: (seasonId: string) => void;
  onCreate: () => void;
  onEdit: (season: any) => void;
  onDelete: (season: any) => void;
  onBack: () => void;
}

export function CreatorSeasonsList({ seasons, onSelect, onCreate, onEdit, onDelete, onBack }: CreatorSeasonsListProps) {
  return (
    <div className="w-full py-6 text-creator-text">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="text-creator-muted hover:text-white text-sm mb-4 inline-flex items-center gap-2"
          >
            &larr; Back to Series
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Mùa</h2>
          <p className="text-creator-muted">Chọn một mùa để quản lý các tập, hoặc tạo mùa mới.</p>
        </div>
        <button 
          onClick={onCreate}
          className="px-6 py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Add Season
        </button>
      </div>

      {seasons.length === 0 ? (
        <div className="bg-creator-sidebar border border-creator-border border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-20 h-20 bg-creator-bg rounded-full flex items-center justify-center mb-6">
            <Layers size={40} className="text-creator-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Không tìm thấy mùa nào</h3>
          <p className="mb-6 text-sm text-creator-muted max-w-sm text-center">
            Series này chưa có mùa nào. Bấm vào nút bên dưới để thêm mùa mới.
          </p>
          <button 
            onClick={onCreate}
            className="px-6 py-3 rounded-md text-sm font-bold bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Add Season
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {seasons.map((season) => (
            <div 
              key={season.id} 
              className="bg-creator-sidebar border border-creator-border rounded-xl p-6 hover:border-creator-gold/50 transition-colors group cursor-pointer flex items-center justify-between"
              onClick={() => onSelect(season.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-creator-bg flex items-center justify-center shrink-0 border border-creator-border">
                  <span className="text-xl font-bold text-creator-gold">{season.seasonNumber}</span>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">{season.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      season.status === "PUBLISHED" ? "bg-green-500/20 text-green-500 border border-green-500/20" :
                      season.status === "DRAFT" ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20" :
                      "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                    }`}>
                      {season.status}
                    </span>
                  </div>
                  <p className="text-sm text-creator-muted max-w-xl line-clamp-2">{season.description || "No description provided."}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(season); }}
                  className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-creator-gold hover:text-black transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(season); }}
                  className="w-10 h-10 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
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
