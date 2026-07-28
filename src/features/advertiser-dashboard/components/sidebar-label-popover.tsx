"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, X, Tag, Edit2, Trash2 } from "lucide-react";
import { useLabels, PREDEFINED_COLORS, AdLabel } from "@/features/ads/hooks/use-labels";

export function SidebarLabelPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const { labels, removeLabel } = useLabels();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<AdLabel | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const filteredLabels = labels.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()));

  const handleMouseLeave = () => {
    if (!isCreateOpen) {
      setIsOpen(false);
    }
  };

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect());
    }
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <div className="flex items-center justify-between px-6 py-2.5 text-[#757575] hover:bg-slate-50 cursor-pointer">
        <span className="text-sm font-medium">Label</span>
        <span className="text-xs">›</span>
      </div>

      {isOpen && rect && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[200] text-slate-900" 
          style={{ top: rect.top, left: rect.right }}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-80 bg-white shadow-xl rounded-md border border-slate-200 cursor-default">
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
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-sm text-sm font-semibold text-slate-700 transition-colors whitespace-nowrap"
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
                    <div key={l.labelId} className="group flex items-center justify-between p-2 hover:bg-slate-50 rounded-sm">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" style={{ color: l.color }} />
                        <span className="text-sm font-medium">{l.name}</span>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-1">
                        <button onClick={() => setEditingLabel(l)} className="p-1 text-slate-400 hover:text-teal-600 rounded-sm hover:bg-slate-200" title="Edit">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { if(window.confirm('Delete this label?')) removeLabel(l.labelId) }} className="p-1 text-slate-400 hover:text-red-600 rounded-sm hover:bg-slate-200" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {isCreateOpen && typeof document !== 'undefined' && createPortal(
        <LabelModal onClose={() => setIsCreateOpen(false)} />,
        document.body
      )}
      
      {editingLabel && typeof document !== 'undefined' && createPortal(
        <LabelModal onClose={() => setEditingLabel(null)} initialData={editingLabel} />,
        document.body
      )}
    </div>
  );
}

function LabelModal({ onClose, initialData }: { onClose: () => void, initialData?: AdLabel }) {
  const { addLabel, editLabel } = useLabels();
  const [name, setName] = useState(initialData?.name || "");
  const [color, setColor] = useState(initialData?.color || PREDEFINED_COLORS[0]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (initialData) {
      editLabel(initialData.labelId, name.trim(), color);
    } else {
      addLabel(name.trim(), color);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50">
      <div className="bg-white w-[500px] rounded-md shadow-2xl overflow-hidden animate-in zoom-in-95 text-slate-900" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="font-bold text-lg text-slate-900">{initialData ? 'Edit label' : 'Create label'}</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-slate-400 hover:text-black" /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900">Label name</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Enter label name"
                value={name}
                onChange={(e) => setName(e.target.value.substring(0, 80))}
                className="w-full border border-slate-300 rounded-sm px-3 py-2 outline-none focus:border-teal-500 pr-12 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                {name.length}/80
              </span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-3 text-slate-900">Color</label>
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
          <button onClick={onClose} className="px-5 py-2 border border-slate-300 bg-white rounded-sm text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-5 py-2 bg-[#00D6BA] hover:bg-[#00BFA5] text-white rounded-sm text-sm font-bold disabled:opacity-50"
          >
            {initialData ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
