import React, { useState } from "react";
import { Plus, GripVertical, Edit3, Trash2, Check, Clock, PlayCircle } from "lucide-react";

export interface SeasonData {
  id: string;
  seasonNumber: number;
  title: string;
  description: string;
  status: string;
  episodes: EpisodeData[];
}

export interface EpisodeData {
  id: string;
  episodeNumber: number;
  title: string;
  status: string;
  duration?: string;
}

interface SeasonStructureStepProps {
  seasons: SeasonData[];
  onAddSeason: (data: { title: string; description: string; seasonNumber: number }) => void;
  onAddEpisode: (seasonId: string) => void;
  onEditEpisode: (episodeId: string) => void;
  onDeleteEpisode: (episodeId: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SeasonStructureStep({ 
  seasons, 
  onAddSeason, 
  onAddEpisode, 
  onEditEpisode, 
  onDeleteEpisode,
  onContinue,
  onBack
}: SeasonStructureStepProps) {
  const [newSeasonForm, setNewSeasonForm] = useState({
    title: "",
    description: "",
    seasonNumber: seasons.length > 0 ? Math.max(...seasons.map(s => s.seasonNumber)) + 1 : 1
  });

  const handleCreateSeason = (e: React.FormEvent) => {
    e.preventDefault();
    onAddSeason(newSeasonForm);
    setNewSeasonForm({
      title: "",
      description: "",
      seasonNumber: newSeasonForm.seasonNumber + 1
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6 text-creator-text">
      {/* Left Column - Visual Structure */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Season Structure</h2>
          <p className="text-sm text-creator-muted">Organize your series into seasons and episodes.</p>
        </div>

        <div className="space-y-6 mt-8">
          {seasons.length === 0 ? (
            <div className="bg-creator-sidebar border border-creator-border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-creator-bg rounded-full flex items-center justify-center mb-4">
                <PlayCircle size={32} className="text-creator-muted" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No seasons yet</h3>
              <p className="text-sm text-creator-muted max-w-sm">
                Start building your series architecture by creating your first season on the right.
              </p>
            </div>
          ) : (
            seasons.map((season) => (
              <div key={season.id} className="bg-creator-sidebar border border-creator-border rounded-xl overflow-hidden">
                <div className="p-5 border-b border-creator-border flex justify-between items-start bg-creator-card/50">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold px-2 py-1 bg-creator-gold/20 text-creator-gold rounded">
                        SEASON {season.seasonNumber < 10 ? `0${season.seasonNumber}` : season.seasonNumber}
                      </span>
                      <h3 className="text-lg font-bold text-white">{season.title}</h3>
                    </div>
                    <p className="text-sm text-creator-muted mt-2">{season.description}</p>
                  </div>
                  <button 
                    onClick={() => onAddEpisode(season.id)}
                    className="text-xs font-medium px-3 py-1.5 border border-creator-border rounded hover:bg-white/5 transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Episode
                  </button>
                </div>

                <div className="p-0">
                  {season.episodes.length === 0 ? (
                    <div className="p-6 text-center text-sm text-creator-muted">
                      No episodes added yet.
                    </div>
                  ) : (
                    <ul className="divide-y divide-creator-border">
                      {season.episodes.map((episode) => (
                        <li key={episode.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                          <GripVertical size={18} className="text-creator-border group-hover:text-creator-muted cursor-grab" />
                          <div className="w-8 h-8 rounded bg-creator-bg border border-creator-border flex items-center justify-center text-xs font-bold text-creator-muted">
                            {episode.episodeNumber}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white">{episode.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-creator-muted">
                              <span className="flex items-center gap-1"><Clock size={12} /> {episode.duration || "00:00"}</span>
                              <span>•</span>
                              <span className={episode.status === "PUBLISHED" ? "text-green-500" : ""}>{episode.status}</span>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <button onClick={() => onEditEpisode(episode.id)} className="p-1.5 text-creator-muted hover:text-white rounded bg-creator-bg">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => onDeleteEpisode(episode.id)} className="p-1.5 text-creator-muted hover:text-red-400 rounded bg-creator-bg">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column - Create Form & Actions */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Create New Season</h3>
          
          <form onSubmit={handleCreateSeason} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-creator-muted">Season Number</label>
              <input 
                type="number" 
                value={newSeasonForm.seasonNumber}
                onChange={(e) => setNewSeasonForm({...newSeasonForm, seasonNumber: parseInt(e.target.value) || 1})}
                className="w-full bg-creator-bg border border-creator-border rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-creator-gold"
                min="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium mb-1.5 text-creator-muted">Season Title</label>
              <input 
                type="text" 
                value={newSeasonForm.title}
                onChange={(e) => setNewSeasonForm({...newSeasonForm, title: e.target.value})}
                className="w-full bg-creator-bg border border-creator-border rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-creator-gold"
                placeholder="E.g., The Beginning"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-creator-muted">Description (Optional)</label>
              <textarea 
                value={newSeasonForm.description}
                onChange={(e) => setNewSeasonForm({...newSeasonForm, description: e.target.value})}
                rows={3}
                className="w-full bg-creator-bg border border-creator-border rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-creator-gold"
                placeholder="What happens in this season?"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-creator-border rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
            >
              <Plus size={16} /> Create Season
            </button>
          </form>
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-creator-border">
          <button 
            onClick={onContinue}
            disabled={seasons.length === 0}
            className="w-full py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Content
            <Check size={16} />
          </button>
          
          <button 
            onClick={onBack}
            className="w-full py-2.5 rounded-md text-sm font-medium text-creator-muted hover:text-white transition-colors"
          >
            Back to Core Identity
          </button>
        </div>
      </div>
    </div>
  );
}
