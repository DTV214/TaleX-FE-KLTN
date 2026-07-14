import React from "react";
import { Plus, Edit3, Trash2, ListVideo, PlayCircle, Clock } from "lucide-react";

interface CreatorEpisodesListProps {
  episodes: any[];
  onSelect: (episodeId: string) => void;
  onCreate: () => void;
  onEdit: (episode: any) => void;
  onDelete: (episode: any) => void;
  onBack: () => void;
}

export function CreatorEpisodesList({ episodes, onSelect, onCreate, onEdit, onDelete, onBack }: CreatorEpisodesListProps) {
  return (
    <div className="w-full p-6 text-creator-text">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <button 
            onClick={onBack}
            className="text-creator-muted hover:text-white text-sm mb-4 inline-flex items-center gap-2"
          >
            &larr; Back to Seasons
          </button>
          <h2 className="text-3xl font-bold text-white mb-2">Số tập</h2>
          <p className="text-creator-muted">Chọn một tập để quản lý nội dung, hoặc thêm tập mới.</p>
        </div>
        <button 
          onClick={onCreate}
          className="px-6 py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Add Episode
        </button>
      </div>

      {episodes.length === 0 ? (
        <div className="bg-creator-sidebar border border-creator-border border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-20 h-20 bg-creator-bg rounded-full flex items-center justify-center mb-6">
            <ListVideo size={40} className="text-creator-muted" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">Không tìm thấy tập nào</h3>
          <p className="text-creator-muted max-w-md mb-8">
            Mùa này chưa có tập nào. Bấm vào nút bên dưới để thêm tập mới.
          </p>
          <button 
            onClick={onCreate}
            className="px-6 py-3 rounded-md text-sm font-bold bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Add Episode
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {episodes.map((episode) => (
            <div 
              key={episode.id} 
              className="bg-creator-sidebar border border-creator-border rounded-xl p-4 hover:border-creator-gold/50 transition-colors group cursor-pointer flex items-center justify-between"
              onClick={() => onSelect(episode.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded bg-creator-bg flex items-center justify-center shrink-0 border border-creator-border">
                  <PlayCircle size={20} className="text-creator-muted group-hover:text-creator-gold transition-colors" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-creator-gold">EP {episode.episodeNumber < 10 ? `0${episode.episodeNumber}` : episode.episodeNumber}</span>
                    <h3 className="text-lg font-bold text-white">{episode.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      episode.status === "PUBLISHED" ? "bg-green-500/20 text-green-500 border border-green-500/20" :
                      episode.status === "DRAFT" ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20" :
                      "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                    }`}>
                      {episode.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-creator-muted mt-1">
                    <span className="flex items-center gap-1"><Clock size={12} /> {episode.duration || "00:00"}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(episode); }}
                  className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-creator-gold hover:text-black transition-colors"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(episode); }}
                  className="w-8 h-8 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
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
