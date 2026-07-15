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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Series của tôi</h2>
          <p className="text-creator-muted">Quản lý series, mùa và tập của bạn.</p>
        </div>
        <button 
          onClick={onCreate}
          className="px-6 py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus size={18} /> Create New Series
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-creator-muted" />
          <input 
            type="text" 
            placeholder="Tìm kiếm series theo tiêu đề..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-creator-sidebar border border-creator-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-creator-gold transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Filter size={18} className="text-creator-muted hidden sm:block" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-creator-sidebar border border-creator-border rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-creator-gold transition-colors w-full sm:w-auto outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả định dạng</option>
            <option value="COMIC">Truyện tranh</option>
            <option value="VIDEO">Video</option>
          </select>
        </div>
      </div>

      {filteredSeries.length === 0 ? (
        <div className="bg-creator-sidebar border border-creator-border border-dashed rounded-xl p-16 flex flex-col items-center justify-center text-center mt-8">
          <div className="w-20 h-20 bg-creator-bg rounded-full flex items-center justify-center mb-6">
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
              className="px-6 py-3 rounded-md text-sm font-bold bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Create New Series
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSeries.map((series) => (
            <div 
              key={series.id} 
              className="bg-creator-sidebar border border-creator-border rounded-xl overflow-hidden hover:border-creator-gold/50 transition-colors group cursor-pointer flex flex-col"
              onClick={() => onSelect(series.id)}
            >
              <div className="aspect-[3/4] w-full relative bg-creator-bg overflow-hidden border-b border-creator-border">
                {series.coverUrl ? (
                  <img src={series.coverUrl} alt={series.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film size={40} className="text-creator-muted/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(series); }}
                    className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-creator-gold hover:text-black transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(series); }}
                    className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    series.status === "PUBLISHED" ? "bg-green-500/20 text-green-500 border border-green-500/20" :
                    series.status === "DRAFT" ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20" :
                    "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                  }`}>
                    {series.status}
                  </span>
                  <h3 className="text-lg font-bold text-white line-clamp-1">{series.title}</h3>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <p className="text-sm text-creator-muted line-clamp-2 mb-4">{series.description || "No description provided."}</p>
                <div className="flex items-center justify-between text-xs font-medium text-creator-muted border-t border-creator-border pt-3">
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
