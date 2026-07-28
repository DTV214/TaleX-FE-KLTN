"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, AlignLeft } from "lucide-react";

export function BreakdownPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState("Breakdown");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = ["By Day", "By Month", "By Year"];

  return (
    <div className="relative" ref={popoverRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 border border-slate-300 rounded-sm bg-white cursor-pointer hover:bg-slate-50 text-sm h-[32px] transition-colors"
      >
        <AlignLeft className="h-4 w-4 text-slate-500" />
        <span className="font-medium text-[#161823]">{selected}</span>
        <ChevronDown className="h-4 w-4 text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-50 animate-in fade-in zoom-in-95 py-1">
          {options.map(opt => (
            <div 
              key={opt}
              onClick={() => {
                setSelected(opt);
                setIsOpen(false);
              }}
              className="px-4 py-2 text-sm text-[#161823] hover:bg-slate-50 cursor-pointer transition-colors"
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
