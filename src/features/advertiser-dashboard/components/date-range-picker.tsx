"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export function DateRangePicker() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState("Jul 21, 2026 - Jul 28, 2026");
  const [activeTab, setActiveTab] = useState("Last 7 days");
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

  const ranges = [
    "Today", "Yesterday", "Last 7 days", "Last 14 days", 
    "Last 30 days", "This week", "Last week", "This month", "Last month"
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 border border-slate-300 rounded-sm bg-white cursor-pointer hover:bg-slate-50 text-sm h-[32px] transition-colors"
      >
        <span className="font-medium text-[#161823]">{selectedRange}</span>
        <Calendar className="h-4 w-4 text-slate-500" />
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[700px] bg-white border border-slate-200 rounded-md shadow-[0_4px_24px_rgba(0,0,0,0.08)] z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between p-4 border-b border-slate-100">
            <span className="font-semibold text-sm text-[#161823]">Define data time range</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-slate-500">Compare dates</span>
              <div className="w-8 h-4 rounded-full bg-slate-200 flex items-center p-0.5 cursor-pointer">
                <div className="w-3 h-3 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
          
          <div className="flex h-[340px]">
            {/* Sidebar */}
            <div className="w-[160px] border-r border-slate-100 overflow-y-auto py-2 custom-scrollbar">
              {ranges.map(range => (
                <div 
                  key={range}
                  onClick={() => setActiveTab(range)}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer transition-colors ${activeTab === range ? 'bg-teal-50/50 text-teal-600 font-medium' : 'text-[#161823] hover:bg-slate-50'}`}
                >
                  {range}
                </div>
              ))}
            </div>
            
            {/* Calendars */}
            <div className="flex-1 flex p-5 gap-6">
              {/* Left Calendar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex gap-4">
                    <button className="text-slate-400 hover:text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
                    <button className="text-slate-400 hover:text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
                  </div>
                  <span className="font-medium text-sm text-[#161823]">July 2026</span>
                  <div></div>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-3 font-medium">
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 text-center text-sm gap-y-2">
                  <div className="text-slate-300 py-1">28</div><div className="text-slate-300 py-1">29</div><div className="text-slate-300 py-1">30</div>
                  <div className="py-1">1</div><div className="py-1">2</div><div className="py-1">3</div><div className="py-1">4</div>
                  <div className="py-1">5</div><div className="py-1">6</div><div className="py-1">7</div><div className="py-1">8</div><div className="py-1">9</div><div className="py-1">10</div><div className="py-1">11</div>
                  <div className="py-1">12</div><div className="py-1">13</div><div className="py-1">14</div><div className="py-1">15</div><div className="py-1">16</div><div className="py-1">17</div><div className="py-1">18</div>
                  <div className="py-1">19</div><div className="py-1">20</div><div className="bg-[#00D6BA] text-white rounded-l-sm py-1 font-medium">21</div><div className="bg-teal-50 text-teal-700 py-1">22</div><div className="bg-teal-50 text-teal-700 py-1">23</div><div className="bg-teal-50 text-teal-700 py-1">24</div><div className="bg-teal-50 text-teal-700 py-1">25</div>
                  <div className="bg-teal-50 text-teal-700 py-1">26</div><div className="bg-teal-50 text-teal-700 py-1">27</div><div className="bg-[#00D6BA] text-white rounded-r-sm py-1 relative font-medium">28<div className="w-1 h-1 bg-white rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></div></div><div className="py-1">29</div><div className="py-1">30</div><div className="py-1">31</div><div className="text-slate-300 py-1">1</div>
                </div>
              </div>
              
              {/* Right Calendar */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-5">
                  <div></div>
                  <span className="font-medium text-sm text-[#161823]">August 2026</span>
                  <div className="flex gap-4">
                    <button className="text-slate-400 hover:text-slate-600"><ChevronRight className="h-4 w-4" /></button>
                    <button className="text-slate-400 hover:text-slate-600"><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-3 font-medium">
                  <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 text-center text-sm gap-y-2">
                  <div className="text-slate-300 py-1">26</div><div className="text-slate-300 py-1">27</div><div className="text-slate-300 py-1 relative">28<div className="w-1 h-1 bg-slate-300 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2"></div></div><div className="text-slate-300 py-1">29</div><div className="text-slate-300 py-1">30</div><div className="text-slate-300 py-1">31</div>
                  <div className="py-1">1</div>
                  <div className="py-1">2</div><div className="py-1">3</div><div className="py-1">4</div><div className="py-1">5</div><div className="py-1">6</div><div className="py-1">7</div><div className="py-1">8</div>
                  <div className="py-1">9</div><div className="py-1">10</div><div className="py-1">11</div><div className="py-1">12</div><div className="py-1">13</div><div className="py-1">14</div><div className="py-1">15</div>
                  <div className="py-1">16</div><div className="py-1">17</div><div className="py-1">18</div><div className="py-1">19</div><div className="py-1">20</div><div className="py-1">21</div><div className="py-1">22</div>
                  <div className="py-1">23</div><div className="py-1">24</div><div className="py-1">25</div><div className="py-1">26</div><div className="py-1">27</div><div className="py-1">28</div><div className="py-1">29</div>
                  <div className="py-1 font-medium text-[#161823]">30</div><div className="py-1 font-medium text-[#161823]">31</div><div className="text-slate-300 py-1">1</div><div className="text-slate-300 py-1">2</div><div className="text-slate-300 py-1">3</div><div className="text-slate-300 py-1">4</div><div className="text-slate-300 py-1">5</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 border-t border-slate-100 flex items-center justify-between rounded-b-md">
            <span className="text-xs text-slate-500 pl-2">UTC+07:00</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-5 py-1.5 text-sm border border-slate-300 rounded-sm font-medium hover:bg-slate-50 transition-colors bg-white text-[#161823]"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="px-5 py-1.5 text-sm bg-[#00D6BA] hover:bg-[#00BFA5] text-white rounded-sm font-medium transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
