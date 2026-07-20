"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit3, Trash2, Plus, ArrowLeft, ChevronRight, Layers } from "lucide-react";
import { toast } from "sonner";
import {
  listCombos,
  createCombo,
  updateCombo,
  deleteCombo,
  type ComboEpisodeResponse,
} from "@/features/creator-dashboard/api/combo.api";
import {
  listSeriesByCreator,
  listSeasonsBySeries,
  listEpisodesBySeason,
} from "@/features/creator-dashboard/api/creator-content-api";

export function ComboManagementView() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingCombo, setEditingCombo] = useState<ComboEpisodeResponse | null>(null);
  const [expandedCombos, setExpandedCombos] = useState<Record<string, boolean>>({});

  const combosQuery = useQuery({
    queryKey: ["creator-dashboard", "combos"],
    queryFn: () => listCombos(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCombo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "combos"] });
      queryClient.invalidateQueries({ queryKey: ["public-combos"] });
    },
  });

  if (view === "create" || view === "edit") {
    return (
      <ComboForm
        combo={editingCombo}
        onBack={() => {
          setView("list");
          setEditingCombo(null);
        }}
        onSaved={() => {
          setView("list");
          setEditingCombo(null);
          queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "combos"] });
          queryClient.invalidateQueries({ queryKey: ["public-combos"] });
        }}
      />
    );
  }

  const combos = combosQuery.data ?? [];

  return (
    <div className="w-full py-6 text-creator-text space-y-8">
      <div className="flex justify-between items-end border-b border-creator-border pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Quản lý Combo</h2>
          <p className="text-creator-muted text-sm">Gộp nhiều tập thành một combo với mức giá tùy chỉnh.</p>
        </div>
        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-2 rounded bg-creator-gold px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Combo
        </button>
      </div>

      {combosQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-creator-gold border-t-transparent"></div>
        </div>
      ) : combos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-creator-border border-dashed bg-creator-sidebar/50 py-16">
          <h3 className="text-lg font-bold text-white mb-2">Chưa có combo nào</h3>
          <p className="mb-6 text-sm text-creator-muted max-w-sm text-center">Nhóm các tập lại với nhau để cung cấp mức giá ưu đãi cho độc giả.</p>
          <button
            onClick={() => setView("create")}
            className="rounded bg-creator-gold px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-colors"
          >
            Create Your First Combo
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <div
              key={combo.comboId}
              className="flex flex-col justify-between rounded-xl border border-creator-border bg-creator-sidebar shadow-xl transition-colors hover:border-creator-gold/50 group"
            >
              <div>
                <div className="aspect-[3/4] w-full relative bg-creator-bg overflow-hidden border-b border-creator-border rounded-t-xl">
                  {combo.episodes?.[0]?.thumbnail ? (
                    <img src={combo.episodes[0].thumbnail} alt={combo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Layers size={40} className="text-creator-muted/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${
                      combo.status === "PUBLISHED" ? "bg-green-500/20 text-green-500 border border-green-500/20" :
                      combo.status === "DRAFT" ? "bg-creator-muted/20 text-creator-muted border border-creator-muted/20" :
                      "bg-creator-gold/20 text-creator-gold border border-creator-gold/20"
                    }`}>
                      {combo.status || "PUBLISHED"}
                    </span>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{combo.title}</h3>
                  </div>
                </div>

              <div className="p-4">
                <p className="text-sm text-creator-muted line-clamp-2 mb-6">{combo.description}</p>
                
                <div className="space-y-2 text-sm bg-creator-bg rounded-lg border border-creator-border p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-creator-muted uppercase tracking-wider text-xs font-bold">Số tập</span>
                    <span className="font-bold text-white">{combo.episodes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-creator-muted uppercase tracking-wider text-xs font-bold">Giá gốc</span>
                    <span className="font-medium line-through text-creator-muted">{combo.originalPriceVnd.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-creator-border mt-2">
                    <span className="text-creator-muted uppercase tracking-wider text-xs font-bold">Giá Combo</span>
                    <span className="font-black text-creator-gold text-lg">{combo.priceVnd.toLocaleString()} đ</span>
                  </div>
                </div>

                {combo.episodes && combo.episodes.length > 0 && (
                  <div className="mt-4 border-t border-creator-border/50 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setExpandedCombos((prev) => ({
                          ...prev,
                          [combo.comboId]: !prev[combo.comboId],
                        }));
                      }}
                      className="text-xs font-bold text-creator-gold hover:opacity-80 flex items-center gap-1 cursor-pointer focus:outline-none"
                    >
                      {expandedCombos[combo.comboId] ? "Ẩn danh sách tập" : "Xem các tập bao gồm"}
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedCombos[combo.comboId] ? "rotate-90" : ""}`} />
                    </button>
                    {expandedCombos[combo.comboId] && (
                      <ul className="mt-2 max-h-32 overflow-y-auto space-y-1.5 pl-2 text-xs text-creator-muted no-scrollbar">
                        {combo.episodes.map((ep) => (
                          <li key={ep.episodeId} className="flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-creator-gold shrink-0" />
                            <span className="truncate">
                              {ep.episodeNumber != null ? `Tập ${ep.episodeNumber}: ` : ""}
                              {ep.title}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingCombo(combo);
                      setView("edit");
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-creator-bg border border-creator-border text-creator-muted hover:text-white transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this combo?")) {
                        deleteMutation.mutate(combo.comboId);
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-md bg-creator-bg border border-creator-border text-creator-muted hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComboForm({
  combo,
  onBack,
  onSaved,
}: {
  combo: ComboEpisodeResponse | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(combo?.title || "");
  const [description, setDescription] = useState(combo?.description || "");
  const [priceVnd, setPriceVnd] = useState(combo?.priceVnd?.toString() || "0");
  const [selectedEpisodes, setSelectedEpisodes] = useState<{id: string, title: string, price: number, seriesId?: string}[]>(
    combo?.episodes?.map((e) => ({ id: e.episodeId, title: e.title, price: e.priceVnd, seriesId: e.seriesId })) || []
  );

  const [selectedSeriesId, setSelectedSeriesId] = useState(combo?.episodes?.[0]?.seriesId || "");
  const [selectedSeasonId, setSelectedSeasonId] = useState("");

  const seriesQuery = useQuery({
    queryKey: ["combo-selector", "series"],
    queryFn: () => listSeriesByCreator(),
  });

  const seasonsQuery = useQuery({
    queryKey: ["combo-selector", "seasons", selectedSeriesId],
    queryFn: () => listSeasonsBySeries(selectedSeriesId),
    enabled: Boolean(selectedSeriesId),
  });

  const episodesQuery = useQuery({
    queryKey: ["combo-selector", "episodes", selectedSeasonId],
    queryFn: () => listEpisodesBySeason(selectedSeasonId),
    enabled: Boolean(selectedSeasonId),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => createCombo(payload),
    onSuccess: onSaved,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateCombo(combo!.comboId, payload),
    onSuccess: onSaved,
  });

  const originalTotalPrice = selectedEpisodes.reduce((acc, ep) => acc + (ep.price || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const comboPriceNum = parseInt(priceVnd) || 0;
    
    if (comboPriceNum > originalTotalPrice) {
      toast.error("Lỗi giá tiền", {
        description: "Tổng tiền của combo phải bé hơn hoặc bằng với tổng các tập có trong đó"
      });
      return;
    }

    const payload = {
      title,
      description,
      status: "PUBLISHED" as const,
      priceVnd: comboPriceNum,
      episodeIds: selectedEpisodes.map((e) => e.id),
    };

    if (combo) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleAddEpisode = (ep: any) => {
    if (!selectedEpisodes.find((e) => e.id === ep.episodeId)) {
      setSelectedEpisodes([
        ...selectedEpisodes,
        { id: ep.episodeId, title: ep.title, price: ep.priceVnd || 0, seriesId: selectedSeriesId },
      ]);
    }
  };

  const handleRemoveEpisode = (id: string) => {
    setSelectedEpisodes(selectedEpisodes.filter((e) => e.id !== id));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="w-full p-6 text-creator-text space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-creator-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Combos
      </button>

      <form onSubmit={handleSubmit} className="bg-creator-sidebar border border-creator-border rounded-xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">{combo ? "Edit Combo" : "Create New Combo"}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tiêu đề</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] rounded-md border border-creator-border bg-creator-bg p-3 text-sm text-white outline-none focus:border-creator-gold resize-none"
            />
          </div>

          <div className="border-t border-b border-creator-border py-6 my-6">
            <h3 className="text-lg font-bold mb-4">Chọn tập</h3>
            
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Series</label>
                <select
                  className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold disabled:opacity-50"
                  value={selectedSeriesId}
                  onChange={(e) => {
                    setSelectedSeriesId(e.target.value);
                    setSelectedSeasonId("");
                  }}
                  disabled={selectedEpisodes.length > 0}
                >
                  <option value="">-- Chọn Series --</option>
                  {seriesQuery.data?.content?.filter((s: any) => s.status === "PUBLISHED").map((s: any) => (
                    <option key={s.seriesId} value={s.seriesId}>{s.title}</option>
                  ))}
                </select>
                {selectedEpisodes.length > 0 && (
                  <p className="text-[10px] text-creator-gold mt-1 italic">
                    Chỉ có thể chọn tập trong cùng 1 series. Bỏ chọn các tập hiện tại để đổi series.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mùa</label>
                <select
                  className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  disabled={!selectedSeriesId}
                >
                  <option value="">-- Chọn Mùa --</option>
                  {seasonsQuery.data?.filter((s: any) => s.status === "PUBLISHED").map((s: any) => (
                    <option key={s.seasonId} value={s.seasonId}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tập</label>
                <select
                  className="h-10 w-full rounded-md border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold"
                  onChange={(e) => {
                    const ep = episodesQuery.data?.find((x: any) => x.episodeId === e.target.value);
                    if (ep) handleAddEpisode(ep);
                    e.target.value = "";
                  }}
                  disabled={!selectedSeasonId}
                  value=""
                >
                  <option value="">-- Chọn tập để thêm --</option>
                  {episodesQuery.data?.filter((ep: any) => ep.unlockType !== "FREE" && ep.status === "PUBLISHED").map((ep: any) => (
                    <option key={ep.episodeId} value={ep.episodeId}>{ep.title} ({ep.priceVnd}đ)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Các tập trong combo này:</label>
              {selectedEpisodes.length === 0 ? (
                <p className="text-sm text-creator-muted italic">Chưa thêm tập nào.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEpisodes.map((ep) => (
                    <li key={ep.id} className="flex items-center justify-between rounded-md bg-creator-bg border border-creator-border p-3 text-sm">
                      <span className="font-semibold">{ep.title}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-creator-muted">{ep.price.toLocaleString()} đ</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEpisode(ep.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-creator-bg border border-creator-border p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-creator-muted font-bold">Tổng giá gốc:</span>
              <span className="line-through text-creator-muted text-base">{originalTotalPrice.toLocaleString()} đ</span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-creator-border">
              <span className="text-creator-muted font-black">Giá Combo cuối cùng (VNĐ):</span>
              <input
                type="number"
                required
                min="0"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="h-10 w-32 rounded-md border border-creator-gold bg-creator-bg px-3 text-right text-sm font-bold text-creator-gold outline-none focus:border-creator-gold"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving || selectedEpisodes.length === 0}
            className="inline-flex items-center justify-center rounded bg-creator-gold px-8 py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            {isSaving ? "Saving..." : "Save Combo"}
          </button>
        </div>
      </form>
    </div>
  );
}
