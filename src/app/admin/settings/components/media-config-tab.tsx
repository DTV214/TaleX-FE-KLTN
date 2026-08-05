"use client";

import { useEffect, useState } from "react";
import { Info, Save } from "lucide-react";
import { mediaSystemConfigApi, type MediaSystemConfig } from "@/features/admin/api/media-system-config.api";
import { toast } from "sonner";

export function MediaConfigTab() {
  const [config, setConfig] = useState<MediaSystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    mediaSystemConfigApi.getConfig()
      .then((data) => {
        setConfig(data);
      })
      .catch((err) => {
        toast.error("Failed to load media configuration");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!config) return;

    setSaving(true);
    try {
      await mediaSystemConfigApi.updateConfig({
        maxComicImages: Number(config.maxComicImages),
        maxComicImageSizeMb: Number(config.maxComicImageSizeMb),
        maxVideoSizeMb: Number(config.maxVideoSizeMb),
      });
      toast.success("Media configuration updated successfully");
    } catch (err) {
      toast.error("Failed to update media configuration");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSave}>
        {/* Section: Upload Limits */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6 text-[#007A8A]">
            <Info className="w-5 h-5" />
            <h3 className="text-lg font-bold">Media Upload Limits</h3>
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide">
                Max Comic Images per Episode
              </label>
              <input
                type="number"
                min="1"
                value={config?.maxComicImages || 20}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, maxComicImages: Number(e.target.value) } : null)}
                className="w-full pb-2 text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#00D1FF] focus:outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500">
                The maximum number of images a creator can upload in a single comic episode. (Default: 20)
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide">
                Max Comic Image Size (MB)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={config?.maxComicImageSizeMb || 3.0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, maxComicImageSizeMb: Number(e.target.value) } : null)}
                className="w-full pb-2 text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#00D1FF] focus:outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500">
                The maximum allowed size for a single comic image page in MB. (Default: 3.0MB)
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-700 tracking-wide">
                Max Video Size (MB)
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={config?.maxVideoSizeMb || 30.0}
                onChange={(e) => setConfig((prev) => prev ? { ...prev, maxVideoSizeMb: Number(e.target.value) } : null)}
                className="w-full pb-2 text-sm text-gray-900 bg-transparent border-b border-gray-200 focus:border-[#00D1FF] focus:outline-none transition-colors"
                required
              />
              <p className="text-xs text-gray-500">
                The maximum allowed size for a video file upload in MB. (Default: 30MB)
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-8 pt-8 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 flex items-center gap-2 rounded-full bg-[#7B42FF] text-sm font-bold text-white shadow-md hover:bg-[#6528F7] transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
