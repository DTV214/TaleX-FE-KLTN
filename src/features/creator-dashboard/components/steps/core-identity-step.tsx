import React, { useState, useRef } from "react";
import { Upload, X, ChevronDown, Check, ImageIcon } from "lucide-react";

export interface CoreIdentityData {
  title: string;
  description: string;
  contentType: "COMIC" | "VIDEO";
  visibility: "PUBLIC" | "PRIVATE";
  ageRating: string;
  language: string;
  categoryIds: string[];
  tagIds: string[];
  coverFile?: File;
  bannerFile?: File;
  coverUrl?: string; // for edit mode
  bannerUrl?: string; // for edit mode
}

interface CoreIdentityStepProps {
  isUpdate?: boolean;
  initialData?: Partial<CoreIdentityData>;
  onSave: (data: CoreIdentityData) => void;
  onCancel?: () => void;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
}

export function CoreIdentityStep({ initialData, onSave, onCancel, categories, tags, isUpdate }: CoreIdentityStepProps) {
  const [formData, setFormData] = useState<CoreIdentityData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    contentType: initialData?.contentType || "COMIC",
    visibility: initialData?.visibility || "PUBLIC",
    ageRating: initialData?.ageRating || "EVERYONE",
    language: initialData?.language || "vi",
    categoryIds: initialData?.categoryIds || [],
    tagIds: initialData?.tagIds || [],
    coverFile: initialData?.coverFile,
    bannerFile: initialData?.bannerFile,
    coverUrl: initialData?.coverUrl,
    bannerUrl: initialData?.bannerUrl,
  });

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const [bannerPreview, setBannerPreview] = useState<string | null>(initialData?.bannerUrl || null);
  const [posterPreview, setPosterPreview] = useState<string | null>(initialData?.coverUrl || null);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, bannerFile: file });
      const objectUrl = URL.createObjectURL(file);
      setBannerPreview(objectUrl);
    }
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, coverFile: file });
      const objectUrl = URL.createObjectURL(file);
      setPosterPreview(objectUrl);
    }
  };

  const toggleCategory = (id: string) => {
    const updated = formData.categoryIds.includes(id)
      ? formData.categoryIds.filter(c => c !== id)
      : [...formData.categoryIds, id];
    setFormData({ ...formData, categoryIds: updated });
  };

  const toggleTag = (id: string) => {
    const updated = formData.tagIds.includes(id)
      ? formData.tagIds.filter(t => t !== id)
      : [...formData.tagIds, id];
    setFormData({ ...formData, tagIds: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto p-6 text-creator-text">
      {/* Left Column - Form Fields */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Core Identity</h2>
          <p className="text-sm text-creator-muted">Define the fundamental characteristics of your new series.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Series Title</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-creator-sidebar border border-creator-border rounded-md px-4 py-3 text-white placeholder-creator-muted focus:outline-none focus:border-creator-gold transition-colors"
              placeholder="Enter an epic title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Narrative Overview</label>
            <textarea 
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full bg-creator-sidebar border border-creator-border rounded-md px-4 py-3 text-white placeholder-creator-muted focus:outline-none focus:border-creator-gold transition-colors"
              placeholder="What is your series about?"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Content Type</label>
            <div className="flex gap-4">
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${isUpdate ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${formData.contentType === "COMIC" ? "border-creator-gold bg-creator-gold/10 text-creator-gold" : "border-creator-border bg-creator-sidebar text-creator-muted hover:border-white/30"}`}>
                <input type="radio" name="contentType" className="hidden" checked={formData.contentType === "COMIC"} onChange={() => !isUpdate && setFormData({ ...formData, contentType: "COMIC" })} disabled={isUpdate} />
                <span className="font-medium">Comic / Webtoon</span>
              </label>
              <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-md border transition-colors ${isUpdate ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${formData.contentType === "VIDEO" ? "border-creator-gold bg-creator-gold/10 text-creator-gold" : "border-creator-border bg-creator-sidebar text-creator-muted hover:border-white/30"}`}>
                <input type="radio" name="contentType" className="hidden" checked={formData.contentType === "VIDEO"} onChange={() => !isUpdate && setFormData({ ...formData, contentType: "VIDEO" })} disabled={isUpdate} />
                <span className="font-medium">Video Series</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Genre Classification</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors border ${
                    formData.categoryIds.includes(cat.id)
                      ? "bg-creator-gold text-black font-semibold border-creator-gold"
                      : "bg-creator-sidebar border-creator-border text-creator-muted hover:border-white/30"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-2 rounded-md text-sm transition-colors border ${
                    formData.tagIds.includes(tag.id)
                      ? "bg-creator-gold text-black font-semibold border-creator-gold"
                      : "bg-creator-sidebar border-creator-border text-creator-muted hover:border-white/30"
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Original Language</label>
              <div className="relative">
                <select 
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-creator-sidebar border border-creator-border rounded-md px-4 py-3 text-white appearance-none focus:outline-none focus:border-creator-gold"
                >
                  <option value="vi">Vietnamese</option>
                  <option value="en">English</option>
                  <option value="jp">Japanese</option>
                  <option value="kr">Korean</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-creator-muted pointer-events-none" size={16} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Age Rating</label>
              <div className="relative">
                <select 
                  value={formData.ageRating}
                  onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
                  className="w-full bg-creator-sidebar border border-creator-border rounded-md px-4 py-3 text-white appearance-none focus:outline-none focus:border-creator-gold"
                >
                  <option value="EVERYONE">Everyone (G)</option>
                  <option value="TEEN">Teen (13+)</option>
                  <option value="MATURE">Mature (18+)</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-creator-muted pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Media Assets */}
      <div className="w-full lg:w-80 space-y-6">
        <div className="bg-creator-sidebar border border-creator-border rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Media Assets</h3>
          
          <div className="space-y-5">
            {/* Vertical Poster */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Vertical Poster</label>
                <span className="text-xs text-creator-muted">2:3 Ratio</span>
              </div>
              <div 
                onClick={() => posterInputRef.current?.click()}
                className={`relative w-[160px] aspect-[2/3] mx-auto rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
                  posterPreview ? "border-creator-gold" : "border-creator-border hover:border-creator-gold/50"
                }`}
              >
                {posterPreview ? (
                  <>
                    <img src={posterPreview} alt="Poster Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={20} className="text-white mb-1" />
                      <span className="text-xs font-medium text-white">Change Poster</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-creator-border rounded-full flex items-center justify-center mb-2">
                      <ImageIcon size={18} className="text-creator-muted" />
                    </div>
                    <span className="text-xs text-creator-muted px-4 text-center">Upload poster</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={posterInputRef} 
                  onChange={handlePosterUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            {/* Widescreen Banner */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Widescreen Banner</label>
                <span className="text-xs text-creator-muted">16:9 Ratio</span>
              </div>
              <div 
                onClick={() => bannerInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden group ${
                  bannerPreview ? "border-creator-gold" : "border-creator-border hover:border-creator-gold/50"
                }`}
              >
                {bannerPreview ? (
                  <>
                    <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload size={20} className="text-white mb-1" />
                      <span className="text-xs font-medium text-white">Change Banner</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-creator-border rounded-full flex items-center justify-center mb-2">
                      <ImageIcon size={18} className="text-creator-muted" />
                    </div>
                    <span className="text-xs text-creator-muted px-4 text-center">Click or drag image to upload banner</span>
                  </>
                )}
                <input 
                  type="file" 
                  ref={bannerInputRef} 
                  onChange={handleBannerUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-creator-border">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel}
              className="px-5 py-2.5 rounded-md text-sm font-medium text-creator-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
          )}
          <button 
            type="submit"
            className="px-5 py-2.5 rounded-md text-sm font-medium bg-creator-gold text-black hover:bg-creator-gold-hover transition-colors flex items-center gap-2"
          >
            {isUpdate ? "Save Changes" : "Continue to Structure"}
            <Check size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
