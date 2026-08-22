"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Edit3,
  Trash2,
  Plus,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Film,
  Package,
  Layers,
} from "lucide-react";
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
      toast.success("Xóa combo thành công");
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "combos"] });
      queryClient.invalidateQueries({ queryKey: ["public-combos"] });
    },
    onError: () => {
      toast.error("Không thể xóa combo. Vui lòng thử lại sau.");
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-creator-border pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-creator-gold/10 border border-creator-gold/20 text-creator-gold">
              <Package className="h-5 w-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Quản lý Gói Combo</h2>
          </div>
        </div>
        <button
          onClick={() => setView("create")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-creator-gold px-5 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-all shadow-lg shadow-creator-gold/10 cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo Combo Mới</span>
        </button>
      </div>

      {/* Content */}
      {combosQuery.isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-creator-gold border-t-transparent"></div>
          <span className="text-xs text-creator-muted font-medium">Đang tải danh sách combo...</span>
        </div>
      ) : combos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-creator-border border-dashed bg-creator-sidebar/40 py-16 px-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-creator-gold/10 border border-creator-gold/20 text-creator-gold mb-4">
            <Package className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Chưa có gói combo nào</h3>
          <p className="mb-6 text-sm text-creator-muted max-w-md">
            Hãy nhóm các tập lại với nhau để cung cấp mức giá ưu đãi hấp dẫn hơn cho độc giả và người xem.
          </p>
          <button
            onClick={() => setView("create")}
            className="inline-flex items-center gap-2 rounded-xl bg-creator-gold px-6 py-2.5 text-sm font-bold text-black hover:opacity-90 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tạo Combo Đầu Tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => {
            const episodeCount = combo.episodes?.length || 0;
            const originalPrice = combo.originalPriceVnd || 0;
            const comboPrice = combo.priceVnd || 0;
            const savedAmount = Math.max(0, originalPrice - comboPrice);
            const discountPercent =
              originalPrice > 0 && savedAmount > 0
                ? Math.round((savedAmount / originalPrice) * 100)
                : 0;
            const isExpanded = Boolean(expandedCombos[combo.comboId]);
            const seriesTitle = combo.episodes?.[0]?.seriesTitle;

            return (
              <div
                key={combo.comboId}
                className="group relative flex flex-col justify-between rounded-2xl border border-creator-border/80 bg-creator-sidebar/90 p-0 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-creator-gold/60 hover:shadow-2xl hover:shadow-creator-gold/5"
              >
                {/* 1. Card Top Header */}
                <div className="p-5 pb-0">
                  {/* Status & Discount Tags Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Badge */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${combo.status === "PUBLISHED"
                            ? "border border-emerald-500/30 bg-emerald-950/80 text-emerald-400"
                            : combo.status === "DRAFT"
                              ? "border border-zinc-500/30 bg-zinc-900/80 text-zinc-300"
                              : "border border-creator-gold/30 bg-creator-gold/10 text-creator-gold"
                          }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                        {combo.status === "PUBLISHED"
                          ? "Đang bán"
                          : combo.status === "DRAFT"
                            ? "Bản nháp"
                            : combo.status || "PUBLISHED"}
                      </span>

                      {/* Episode Count Badge */}
                      <span className="inline-flex items-center gap-1 rounded-full border border-creator-border bg-creator-bg/80 px-2.5 py-0.5 text-[10px] font-bold text-creator-muted">
                        <Layers className="h-3 w-3 text-creator-gold" />
                        {episodeCount} tập
                      </span>
                    </div>

                    {/* Savings Tag */}
                    {discountPercent > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500 to-yellow-400 px-2.5 py-0.5 text-[11px] font-black text-black shadow-md">
                        <Sparkles className="h-3 w-3" />
                        - {discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Title & Series */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white group-hover:text-creator-gold transition-colors line-clamp-1">
                      {combo.title}
                    </h3>
                    {seriesTitle && (
                      <p className="text-xs font-medium text-creator-muted/80 line-clamp-1 flex items-center gap-1">
                        <span className="text-creator-gold">Series:</span> {seriesTitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Card Content Body */}
                <div className="flex flex-1 flex-col p-5 pt-3">
                  {/* Description */}
                  <p className="min-h-[2.5rem] text-xs text-creator-muted/90 line-clamp-2 leading-relaxed mb-4">
                    {combo.description || "Gói combo tiết kiệm bao gồm các tập chọn lọc."}
                  </p>

                  {/* Pricing Box */}
                  <div className="rounded-xl border border-creator-border bg-creator-bg/90 p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-creator-muted">Giá gốc ({episodeCount} tập):</span>
                      <span className="font-medium text-creator-muted line-through">
                        {originalPrice.toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-creator-border/60 pt-2.5">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-creator-muted">
                          Giá Combo
                        </span>
                        {savedAmount > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-400">
                            Tiết kiệm {savedAmount.toLocaleString("vi-VN")} ₫
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-creator-gold drop-shadow-sm">
                          {comboPrice.toLocaleString("vi-VN")} ₫
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Episodes Toggle */}
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
                        className="flex w-full items-center justify-between text-xs font-bold text-creator-muted transition-colors hover:text-creator-gold cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Film className="h-3.5 w-3.5 text-creator-gold" />
                          Danh sách {episodeCount} tập trong combo
                        </span>
                        <ChevronRight
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90 text-creator-gold" : ""
                            }`}
                        />
                      </button>

                      {isExpanded && (
                        <ul className="mt-2.5 max-h-40 overflow-y-auto space-y-1.5 rounded-lg bg-creator-bg/60 p-2.5 text-xs border border-creator-border/40 divide-y divide-creator-border/20">
                          {combo.episodes.map((ep, idx) => (
                            <li
                              key={ep.episodeId}
                              className="flex items-center justify-between gap-2 pt-1.5 first:pt-0 text-creator-muted"
                            >
                              <span className="truncate flex items-center gap-2">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-creator-gold/10 text-[10px] font-bold text-creator-gold">
                                  {ep.episodeNumber ?? idx + 1}
                                </span>
                                <span className="truncate text-white/90">{ep.title}</span>
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold text-creator-muted">
                                {(ep.priceVnd || 0).toLocaleString("vi-VN")} ₫
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Card Actions Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-creator-border/60 bg-creator-bg/40 px-5 py-3 rounded-b-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCombo(combo);
                      setView("edit");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-creator-border bg-creator-bg px-3.5 py-1.5 text-xs font-bold text-creator-muted transition hover:border-creator-gold/50 hover:bg-creator-gold/10 hover:text-creator-gold cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa combo "${combo.title}"?`)) {
                        deleteMutation.mutate(combo.comboId);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-950/20 px-3.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-900/40 hover:text-red-300 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            );
          })}
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
  const [selectedEpisodes, setSelectedEpisodes] = useState<{ id: string, title: string, price: number, seriesId?: string }[]>(
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
    onSuccess: () => {
      toast.success("Tạo combo thành công!");
      onSaved();
    },
    onError: () => {
      toast.error("Không thể tạo combo. Vui lòng kiểm tra lại thông tin.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateCombo(combo!.comboId, payload),
    onSuccess: () => {
      toast.success("Cập nhật combo thành công!");
      onSaved();
    },
    onError: () => {
      toast.error("Không thể cập nhật combo. Vui lòng thử lại sau.");
    },
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
    <div className="w-full py-6 text-creator-text space-y-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-creator-muted hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách Combo
      </button>

      <form onSubmit={handleSubmit} className="bg-creator-sidebar border border-creator-border rounded-2xl p-8 shadow-xl space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">{combo ? "Chỉnh Sửa Gói Combo" : "Tạo Gói Combo Mới"}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Tiêu đề Combo</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Trọn bộ Arc Đại Chiến Phần 1..."
              className="h-11 w-full rounded-xl border border-creator-border bg-creator-bg px-3.5 text-sm text-white outline-none focus:border-creator-gold transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ưu đãi của gói combo này..."
              className="w-full min-h-[100px] rounded-xl border border-creator-border bg-creator-bg p-3.5 text-sm text-white outline-none focus:border-creator-gold resize-none transition"
            />
          </div>

          <div className="border-t border-b border-creator-border py-6 my-6">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Film className="h-4 w-4 text-creator-gold" />
              Chọn các tập đưa vào Combo
            </h3>

            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">Series</label>
                <select
                  className="h-11 w-full rounded-xl border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold disabled:opacity-50 transition"
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
                  className="h-11 w-full rounded-xl border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold transition"
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
                  className="h-11 w-full rounded-xl border border-creator-border bg-creator-bg px-3 text-sm text-white outline-none focus:border-creator-gold transition"
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
                    <option key={ep.episodeId} value={ep.episodeId}>{ep.title} ({ep.priceVnd} ₫)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-creator-muted uppercase tracking-wider mb-2">
                Các tập trong combo này ({selectedEpisodes.length}):
              </label>
              {selectedEpisodes.length === 0 ? (
                <p className="text-sm text-creator-muted italic bg-creator-bg/50 p-4 rounded-xl border border-creator-border/50 text-center">
                  Chưa thêm tập nào vào gói.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedEpisodes.map((ep, idx) => (
                    <li key={ep.id} className="flex items-center justify-between rounded-xl bg-creator-bg border border-creator-border p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-creator-gold/10 text-xs font-bold text-creator-gold">
                          {idx + 1}
                        </span>
                        <span className="font-semibold text-white">{ep.title}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-creator-muted font-medium">{(ep.price || 0).toLocaleString()} ₫</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEpisode(ep.id)}
                          className="text-red-400 hover:text-red-300 p-1 cursor-pointer transition-colors"
                          title="Xóa tập này khỏi combo"
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

          <div className="bg-creator-bg border border-creator-border p-5 rounded-2xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-creator-muted font-bold">Tổng giá gốc các tập:</span>
              <span className="line-through text-creator-muted text-base font-semibold">{originalTotalPrice.toLocaleString()} ₫</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-creator-border">
              <span className="text-white font-black">Giá Combo cuối cùng (VNĐ):</span>
              <input
                type="number"
                required
                min="0"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="h-11 w-36 rounded-xl border border-creator-gold bg-creator-bg px-3.5 text-right text-base font-black text-creator-gold outline-none focus:border-creator-gold transition"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border border-creator-border px-6 py-2.5 text-sm font-bold text-creator-muted hover:text-white transition cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving || selectedEpisodes.length === 0}
            className="inline-flex items-center justify-center rounded-xl bg-creator-gold px-8 py-2.5 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50 transition-colors shadow-lg shadow-creator-gold/10 cursor-pointer"
          >
            {isSaving ? "Đang lưu..." : combo ? "Cập Nhật Combo" : "Lưu Combo Mới"}
          </button>
        </div>
      </form>
    </div>
  );
}
