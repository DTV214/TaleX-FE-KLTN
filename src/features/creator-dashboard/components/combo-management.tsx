"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Edit3, Trash2, Plus, ArrowLeft } from "lucide-react";
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

  const combosQuery = useQuery({
    queryKey: ["creator-dashboard", "combos"],
    queryFn: () => listCombos(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCombo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-dashboard", "combos"] });
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
        }}
      />
    );
  }

  const combos = combosQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Combos</h2>
        <button
          onClick={() => setView("create")}
          className="inline-flex items-center gap-2 rounded-full bg-[#007A8A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#006B79]"
        >
          <Plus className="h-4 w-4" />
          Create Combo
        </button>
      </div>

      {combosQuery.isLoading ? (
        <p>Loading combos...</p>
      ) : combos.length === 0 ? (
        <p className="text-slate-500">No combos found. Create one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {combos.map((combo) => (
            <div
              key={combo.comboId}
              className="flex flex-col justify-between rounded-2xl border border-[#D9E2F0] bg-white p-5 shadow-sm"
            >
              <div>
                <h3 className="font-bold text-lg text-[#151A23]">{combo.title}</h3>
                <p className="text-sm text-[#5D5160] line-clamp-2 mt-1">{combo.description}</p>
                
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Episodes:</span>
                    <span className="font-semibold">{combo.episodes?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Original Price:</span>
                    <span className="font-semibold line-through text-slate-400">{combo.originalPriceVnd.toLocaleString()} đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Combo Price:</span>
                    <span className="font-bold text-[#007A8A]">{combo.priceVnd.toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#F4F6FB] pt-4">
                <button
                  onClick={() => {
                    setEditingCombo(combo);
                    setView("edit");
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F8FAFF] text-[#007A8A] hover:bg-[#E5F5F7]"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this combo?")) {
                      deleteMutation.mutate(combo.comboId);
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFF7F6] text-[#B42318] hover:bg-[#FFEAE8]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
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
  const [selectedEpisodes, setSelectedEpisodes] = useState<{id: string, title: string, price: number}[]>(
    combo?.episodes?.map((e) => ({ id: e.episodeId, title: e.title, price: e.priceVnd })) || []
  );

  const [selectedSeriesId, setSelectedSeriesId] = useState("");
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
    const payload = {
      title,
      description,
      status: "PUBLISHED" as const,
      priceVnd: parseInt(priceVnd) || 0,
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
        { id: ep.episodeId, title: ep.title, price: ep.priceVnd || 0 },
      ]);
    }
  };

  const handleRemoveEpisode = (id: string) => {
    setSelectedEpisodes(selectedEpisodes.filter((e) => e.id !== id));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Combos
      </button>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[#D9E2F0] bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">{combo ? "Edit Combo" : "Create New Combo"}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-[#007A8A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] rounded-xl border border-slate-300 p-3 text-sm focus:border-[#007A8A] focus:outline-none"
            />
          </div>

          <div className="border-t border-b border-slate-100 py-6 my-6">
            <h3 className="text-lg font-bold mb-4">Select Episodes</h3>
            
            <div className="grid gap-4 md:grid-cols-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Series</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                  value={selectedSeriesId}
                  onChange={(e) => {
                    setSelectedSeriesId(e.target.value);
                    setSelectedSeasonId("");
                  }}
                >
                  <option value="">-- Select Series --</option>
                  {seriesQuery.data?.content?.map((s: any) => (
                    <option key={s.seriesId} value={s.seriesId}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Season</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                  value={selectedSeasonId}
                  onChange={(e) => setSelectedSeasonId(e.target.value)}
                  disabled={!selectedSeriesId}
                >
                  <option value="">-- Select Season --</option>
                  {seasonsQuery.data?.map((s: any) => (
                    <option key={s.seasonId} value={s.seasonId}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Episode</label>
                <select
                  className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                  onChange={(e) => {
                    const ep = episodesQuery.data?.find((x: any) => x.episodeId === e.target.value);
                    if (ep) handleAddEpisode(ep);
                    e.target.value = "";
                  }}
                  disabled={!selectedSeasonId}
                  value=""
                >
                  <option value="">-- Select Episode to Add --</option>
                  {episodesQuery.data?.map((ep: any) => (
                    <option key={ep.episodeId} value={ep.episodeId}>{ep.title} ({ep.priceVnd}đ)</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Episodes in this combo:</label>
              {selectedEpisodes.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No episodes added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {selectedEpisodes.map((ep) => (
                    <li key={ep.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm">
                      <span className="font-semibold">{ep.title}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-slate-500">{ep.price.toLocaleString()} đ</span>
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

          <div className="bg-slate-50 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold">Original Total Price:</span>
              <span className="line-through text-slate-400 text-base">{originalTotalPrice.toLocaleString()} đ</span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-slate-200">
              <span className="text-slate-700 font-black">Final Combo Price (VND):</span>
              <input
                type="number"
                required
                min="0"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="w-32 rounded-lg border border-[#007A8A] p-2 text-right font-bold text-[#007A8A] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving || selectedEpisodes.length === 0}
            className="rounded-full bg-[#007A8A] px-8 py-3 text-sm font-black text-white hover:bg-[#006B79] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Combo"}
          </button>
        </div>
      </form>
    </div>
  );
}
