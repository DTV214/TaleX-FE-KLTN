"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onChange?: (start: string, end: string) => void;
  className?: string;
}

function formatDateForInput(date: Date) {
  const d = new Date(date);
  let month = '' + (d.getMonth() + 1);
  let day = '' + d.getDate();
  const year = d.getFullYear();
  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

function formatDisplayDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const m = d.toLocaleString('en-US', { month: 'short' });
  return `${m} ${d.getDate()}, ${d.getFullYear()}`;
}

export function DateRangePicker({ startDate, endDate, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use internal state if props aren't provided (for backward compatibility in page.tsx)
  const [internalStart, setInternalStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return formatDateForInput(d);
  });
  const [internalEnd, setInternalEnd] = useState(() => formatDateForInput(new Date()));

  const actualStart = startDate || internalStart;
  const actualEnd = endDate || internalEnd;

  const [activeTab, setActiveTab] = useState("Last 7 days");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date(actualStart || new Date());
    d.setDate(1);
    return d;
  });
  const [selectionStart, setSelectionStart] = useState<Date | null>(new Date(actualStart));
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(new Date(actualEnd));

  useEffect(() => {
    if (isOpen) {
      setSelectionStart(actualStart ? new Date(actualStart) : new Date());
      setSelectionEnd(actualEnd ? new Date(actualEnd) : new Date());
      
      const d = new Date(actualEnd || new Date());
      d.setDate(1);
      // Try to show start and end dates if possible. If they are in the same month or consecutive, showing start month is fine.
      // If we just default to end date's month minus 1, it usually covers both.
      d.setMonth(d.getMonth() - 1); 
      setCurrentMonth(d);
    }
  }, [isOpen, actualStart, actualEnd]);

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

  const handleSelectRange = (range: string) => {
    setActiveTab(range);
    const today = new Date();
    let newStart = new Date();
    let newEnd = new Date();

    if (range === "Today") {
      // already today
    } else if (range === "Yesterday") {
      newStart.setDate(today.getDate() - 1);
      newEnd.setDate(today.getDate() - 1);
    } else if (range === "Last 7 days") {
      newStart.setDate(today.getDate() - 7);
    } else if (range === "Last 14 days") {
      newStart.setDate(today.getDate() - 14);
    } else if (range === "Last 30 days") {
      newStart.setDate(today.getDate() - 30);
    } else if (range === "This week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
      newStart.setDate(diff);
    } else if (range === "This month") {
      newStart = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (range === "Last month") {
      newStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      newEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    } else {
      newStart.setDate(today.getDate() - 7); // fallback
    }

    setSelectionStart(newStart);
    setSelectionEnd(newEnd);
  };

  const handleDayClick = (date: Date) => {
    setActiveTab(""); // Clear predefined tab selection
    if (!selectionStart || (selectionStart && selectionEnd)) {
      setSelectionStart(date);
      setSelectionEnd(null);
    } else {
      if (date < selectionStart) {
        setSelectionEnd(selectionStart);
        setSelectionStart(date);
      } else {
        setSelectionEnd(date);
      }
    }
  };

  const confirmSelection = () => {
    if (!selectionStart) return;
    
    // If only one date selected, make it a single-day range
    const finalEnd = selectionEnd || selectionStart;
    
    const startStr = formatDateForInput(selectionStart);
    const endStr = formatDateForInput(finalEnd);

    if (onChange) {
      onChange(startStr, endStr);
    } else {
      setInternalStart(startStr);
      setInternalEnd(endStr);
    }
    setIsOpen(false);
  };

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };

  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const renderCalendar = (monthOffset: number) => {
    const targetMonth = new Date(currentMonth);
    targetMonth.setMonth(targetMonth.getMonth() + monthOffset);
    
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const monthLabel = targetMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const days = [];
    
    // Previous month padding
    for (let i = 0; i < firstDay; i++) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - firstDay + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month padding (to complete the 42 cell grid)
    const totalCells = Math.ceil(days.length / 7) * 7;
    const remaining = totalCells - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return (
      <div className="flex-1 select-none">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-4">
            {monthOffset === 0 ? (
              <button onClick={prevMonth} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="h-4 w-4" /></button>
            ) : <div className="w-4" />}
          </div>
          <span className="font-medium text-sm text-[#161823]">{monthLabel}</span>
          <div className="flex gap-4">
            {monthOffset === 1 ? (
              <button onClick={nextMonth} className="text-slate-400 hover:text-slate-600"><ChevronRight className="h-4 w-4" /></button>
            ) : <div className="w-4" />}
          </div>
        </div>
        
        <div className="grid grid-cols-7 text-center text-xs text-slate-500 mb-3 font-medium">
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        
        <div className="grid grid-cols-7 text-center text-sm gap-y-2 text-[#161823]">
          {days.map((d, i) => {
            const dateStr = formatDateForInput(d.date);
            const startStr = selectionStart ? formatDateForInput(selectionStart) : null;
            const endStr = selectionEnd ? formatDateForInput(selectionEnd) : null;
            
            const isStart = dateStr === startStr;
            const isEnd = dateStr === endStr;
            const isSelected = isStart || isEnd;
            const isInRange = startStr && endStr && dateStr > startStr && dateStr < endStr;

            let className = "py-1 cursor-pointer relative z-10 transition-colors rounded-sm hover:bg-slate-100 ";
            if (!d.isCurrentMonth) className += "text-slate-300 ";
            
            if (isSelected) {
              className = "py-1 cursor-pointer font-medium text-white relative z-10 ";
            } else if (isInRange) {
              className = "py-1 cursor-pointer bg-teal-50 text-teal-700 relative z-10 ";
            }

            return (
              <div key={i} className="relative">
                {isSelected && (
                  <div className={`absolute inset-0 bg-[#00D6BA] z-0 ${isStart && !isEnd && selectionEnd ? 'rounded-l-sm' : ''} ${isEnd && !isStart ? 'rounded-r-sm' : ''} ${isStart && isEnd ? 'rounded-sm' : ''} ${isStart && !selectionEnd ? 'rounded-sm' : ''}`}></div>
                )}
                {/* Connecting background for start/end if they are adjacent or separated */}
                {isStart && selectionEnd && startStr !== endStr && (
                   <div className="absolute top-0 right-0 bottom-0 w-1/2 bg-teal-50 -z-10"></div>
                )}
                {isEnd && selectionStart && startStr !== endStr && (
                   <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-teal-50 -z-10"></div>
                )}
                
                <div onClick={() => handleDayClick(d.date)} className={className}>
                  {d.date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const displayString = `${formatDisplayDate(actualStart)} - ${formatDisplayDate(actualEnd)}`;

  return (
    <div className={`relative ${className || ""}`} ref={popoverRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 border border-slate-300 rounded-sm bg-white cursor-pointer hover:bg-slate-50 text-sm h-[32px] transition-colors"
      >
        <span className="font-medium text-[#161823] whitespace-nowrap">{displayString}</span>
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
          
          <div className="flex min-h-[340px]">
            {/* Sidebar */}
            <div className="w-[160px] border-r border-slate-100 overflow-y-auto py-2 custom-scrollbar">
              {ranges.map(range => (
                <div 
                  key={range}
                  onClick={() => handleSelectRange(range)}
                  className={`px-4 py-2.5 text-[13px] cursor-pointer transition-colors ${activeTab === range ? 'bg-teal-50/50 text-teal-600 font-medium' : 'text-[#161823] hover:bg-slate-50'}`}
                >
                  {range}
                </div>
              ))}
            </div>
            
            {/* Calendars */}
            <div className="flex-1 flex p-5 gap-6">
              {renderCalendar(0)}
              {renderCalendar(1)}
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
                onClick={confirmSelection}
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
