"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Plus, X, Tag } from "lucide-react";
import { useLabels, PREDEFINED_COLORS, AdLabel } from "@/features/ads/hooks/use-labels";

export function SidebarLabelPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { labels } = useLabels();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredLabels = labels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <div className="flex items-center justify-between px-6 py-2.5 text-[#757575] hover:bg-slate-50 cursor-pointer">
        <span className="text-sm font-medium">Label</span>
        <span className="text-xs">›</span>
      </div>

      {isOpen && (
        <div className="absolute left-full top-0 ml-2 w-80 bg-white shadow-xl rounded-md border border-slate-200 z-[100] cursor-default" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by label name" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-sm text-sm outline-none focus:border-teal-500"
              />
            </div>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Create label
            </button>
          </div>

          <div className="p-4 h-64 overflow-y-auto">
            {filteredLabels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                  <Tag className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-sm">There aren't any labels to search.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredLabels.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-sm">
                    <Tag className="h-4 w-4" style={{ color: l.color }} />
                    <span className="text-sm font-medium">{l.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <button className="text-teal-600 hover:underline text-sm font-medium flex items-center gap-1">
              <span className="text-lg">✎</span> Manage label
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">0 labels selected</span>
              <button disabled className="bg-teal-100 text-teal-600 px-4 py-1.5 rounded-sm text-sm font-medium opacity-50 cursor-not-allowed">
                Add label
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <CreateLabelModal onClose={() => setIsCreateOpen(false)} />
      )}
    </div>
  );
}

function CreateLabelModal({ onClose }: { onClose: () => void }) {
  const { addLabel } = useLabels();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PREDEFINED_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    addLabel(name.trim(), color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white w-[500px] rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg">Create label</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-black" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Label name</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter label name"
                value={name}
                onChange={(e) => setName(e.target.value.substring(0, 80))}
                className="w-full border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-teal-500 pr-12 text-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {name.length}/80
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3">Color</label>
            <div className="flex items-center gap-3">
              {PREDEFINED_COLORS.map((c) => (
                <button 
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-sm flex items-center justify-center border-2 transition-all ${color === c ? 'border-slate-400 scale-110' : 'border-transparent hover:border-slate-200'}`}
                >
                  <Tag className="h-4 w-4" style={{ color: c }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <button onClick={onClose} className="px-5 py-2 border border-slate-300 rounded-sm text-sm font-medium hover:bg-slate-100">
            Cancel
          </button>
          <button 
            onClick={handleCreate}
            disabled={!name.trim()}
            className="px-5 py-2 bg-[#00D6BA] hover:bg-[#00BFA5] text-white rounded-sm text-sm font-bold disabled:opacity-50"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
