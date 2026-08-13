import { useState } from "react";
import { X, Download } from "lucide-react";

export type ExportField = "impressions" | "clicks" | "ctr" | "spend" | "views6s";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (selectedFields: ExportField[], startDate?: string, endDate?: string) => void;
  campaignName: string;
}

const FIELD_OPTIONS: { id: ExportField; label: string }[] = [
  { id: "impressions", label: "Impressions (Lượt hiển thị)" },
  { id: "clicks", label: "Clicks (Lượt click)" },
  { id: "ctr", label: "CTR (Tỉ lệ click)" },
  { id: "spend", label: "Spend (Chi phí)" },
  { id: "views6s", label: "Focused Views (6s)" },
];

export function ExportModal({ isOpen, onClose, onExport, campaignName }: ExportModalProps) {
  const [selectedFields, setSelectedFields] = useState<ExportField[]>([
    "impressions",
    "clicks",
    "ctr",
    "spend",
    "views6s",
  ]);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  if (!isOpen) return null;

  const toggleField = (field: ExportField) => {
    setSelectedFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSelectAll = () => {
    if (selectedFields.length === FIELD_OPTIONS.length) {
      setSelectedFields([]);
    } else {
      setSelectedFields(FIELD_OPTIONS.map((f) => f.id));
    }
  };

  const handleExport = () => {
    if (selectedFields.length === 0) return;
    onExport(selectedFields, startDate, endDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Export Detailed Analysis</h2>
            <p className="text-sm text-slate-500 mt-1 line-clamp-1" title={campaignName}>
              Chiến dịch: {campaignName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="text-sm font-medium text-slate-700 mb-4">
            Chọn các trường dữ liệu muốn xuất (Detailed Analysis):
          </p>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="select-all"
              checked={selectedFields.length === FIELD_OPTIONS.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-[#161823] bg-gray-100 border-gray-300 rounded focus:ring-slate-800 cursor-pointer"
            />
            <label htmlFor="select-all" className="ml-3 text-sm font-semibold text-slate-800 cursor-pointer">
              Chọn tất cả
            </label>
          </div>
          
          <div className="space-y-3 pl-2">
            {FIELD_OPTIONS.map((field) => (
              <div key={field.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`field-${field.id}`}
                  checked={selectedFields.includes(field.id)}
                  onChange={() => toggleField(field.id)}
                  className="w-4 h-4 text-[#161823] bg-gray-100 border-gray-300 rounded focus:ring-slate-800 cursor-pointer"
                />
                <label
                  htmlFor={`field-${field.id}`}
                  className="ml-3 text-sm text-slate-600 cursor-pointer select-none"
                >
                  {field.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 pb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">
            Lọc theo thời gian (mặc định lấy tất cả):
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Từ ngày</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-sm text-slate-800 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-800"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate-500 mb-1">Đến ngày</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-sm text-slate-800 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-slate-800"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleExport}
            disabled={selectedFields.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#161823] rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-teal-600/20"
          >
            <Download className="h-4 w-4" />
            Xuất Excel
          </button>
        </div>
      </div>
    </div>
  );
}
