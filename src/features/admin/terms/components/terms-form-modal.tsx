"use client";

import { useState, type FormEvent } from "react";
import { X, Loader2, Save, AlertCircle, Eye } from "lucide-react";
import {
  useTermsVersion,
  useCreateTermsVersion,
  useUpdateTermsVersion,
} from "../hooks/useTermsQueries";
import {
  TermsType,
  CreateTermsPayload,
  UpdateTermsPayload,
  ApiResponse,
  TermsVersion,
} from "../types/terms.types";

interface TermsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId?: string | null;
  mode?: "create" | "edit" | "view";
}

const initialFormState: CreateTermsPayload = {
  version: "",
  type: "CREATOR_VERIFYING_PROCESS",
  content: "",
  isActive: false,
};

const termsTypeLabels: Record<TermsType, string> = {
  CREATOR: "Điều khoản Creator",
  GENERAL_TOS: "Điều khoản chung",
  CREATOR_VERIFYING_PROCESS: "Quá trình xác thực (Creator)",
  CREATOR_ENABLE_MONETIZATION: "Bật kiếm tiền (Creator)",
};

function getMutationErrorMessage(error: unknown) {
  const maybeResponseError = error as {
    response?: {
      data?: {
        message?: unknown;
      };
    };
  };

  if (
    typeof maybeResponseError.response?.data?.message === "string"
  ) {
    return maybeResponseError.response.data.message;
  }

  return error instanceof Error
    ? error.message
    : "Đã có lỗi xảy ra. Vui lòng thử lại.";
}

export function TermsFormModal({
  isOpen,
  onClose,
  targetId,
  mode = "create",
}: TermsFormModalProps) {
  const isEditMode = mode === "edit";
  const isViewMode = mode === "view";

  const { data: detailResponse, isLoading: isFetchingDetail } = useTermsVersion(
    isOpen && targetId ? targetId : "",
  );

  const createMutation = useCreateTermsVersion();
  const updateMutation = useUpdateTermsVersion();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const initialData: CreateTermsPayload =
    (isEditMode || isViewMode) && detailResponse?.data
      ? {
          version: detailResponse.data.version,
          type: detailResponse.data.type,
          content: detailResponse.data.content,
          isActive: detailResponse.data.isActive,
        }
      : initialFormState;

  const formKey =
    isEditMode || isViewMode
      ? `${mode}-${targetId}-${detailResponse?.data?.updatedAt ?? detailResponse?.data?.createdAt ?? "loading"}`
      : "create";

  if (!isOpen) return null;

  const renderTitle = () => {
    if (isViewMode) return "Chi tiết Điều khoản";
    if (isEditMode) return "Chỉnh sửa Điều khoản";
    return "Tạo mới Điều khoản";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={!isSaving ? onClose : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8F9FA]">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            {isViewMode && <Eye className="w-5 h-5 text-gray-500" />}
            {renderTitle()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {(isEditMode || isViewMode) && isFetchingDetail ? (
          <div className="flex flex-col items-center justify-center p-12 flex-1">
            <Loader2 className="w-8 h-8 text-[#7B42FF] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <TermsForm
            key={formKey}
            initialData={initialData}
            isEditMode={isEditMode}
            isViewMode={isViewMode}
            targetId={targetId}
            isSaving={isSaving}
            onClose={onClose}
            onCreate={(payload) => createMutation.mutateAsync(payload)}
            onUpdate={(id, payload) =>
              updateMutation.mutateAsync({ id, payload })
            }
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// FORM COMPONENT
// ==========================================

type TermsFormProps = {
  initialData: CreateTermsPayload;
  isEditMode: boolean;
  isViewMode: boolean;
  targetId?: string | null;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTermsPayload) => Promise<ApiResponse<TermsVersion>>;
  onUpdate: (
    id: string,
    payload: UpdateTermsPayload,
  ) => Promise<ApiResponse<TermsVersion>>;
};

function TermsForm({
  initialData,
  isEditMode,
  isViewMode,
  targetId,
  isSaving,
  onClose,
  onCreate,
  onUpdate,
}: TermsFormProps) {
  const [formData, setFormData] = useState<CreateTermsPayload>(initialData);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isViewMode) return;

    setErrorMsg(null);

    if (!formData.version.trim() || !formData.content.trim()) {
      setErrorMsg("Mã phiên bản và nội dung là các trường bắt buộc.");
      return;
    }

    try {
      let res: ApiResponse<TermsVersion>;

      if (isEditMode && targetId) {
        // [SỬA LỖI 500]: Gửi toàn bộ formData (bao gồm cả 'type') lên cho Backend
        res = await onUpdate(targetId, formData);
      } else {
        res = await onCreate(formData);
      }

      if (res.code === 200 || res.code === 201) {
        onClose();
      } else {
        setErrorMsg(res.message || "Thao tác thất bại do lỗi xử lý máy chủ.");
      }
    } catch (error) {
      setErrorMsg(getMutationErrorMessage(error));
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col flex-1 overflow-hidden"
    >
      <div className="p-6 overflow-y-auto flex-1 space-y-5">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-sm text-[#E50914] bg-red-50 border border-red-100 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Mã phiên bản{" "}
              {!isViewMode && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              required={!isViewMode}
              disabled={isViewMode}
              placeholder="VD: 1.0 hoặc 2024-V1"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all disabled:opacity-70 disabled:bg-gray-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Phân loại điều khoản
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as TermsType,
                })
              }
              disabled={isEditMode || isViewMode}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {Object.entries(termsTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-[#F8F9FA]/50">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              {isViewMode ? "Trạng thái hoạt động" : "Đặt làm bản đang hoạt động"}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              {isViewMode
                ? "Hiển thị xem phiên bản này có đang được kích hoạt hay không."
                : "Kích hoạt phiên bản này sẽ áp dụng nó làm điều khoản chính thức hiện tại."}
            </p>
          </div>
          <label
            className={`relative inline-flex items-center ${isViewMode ? "cursor-default opacity-80" : "cursor-pointer"}`}
          >
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.isActive}
              disabled={isViewMode}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7B42FF]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A389]"></div>
          </label>
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-sm font-semibold text-gray-700">
            Nội dung (HTML/Markdown){" "}
            {!isViewMode && <span className="text-red-500">*</span>}
          </label>
          <textarea
            required={!isViewMode}
            disabled={isViewMode}
            rows={10}
            placeholder="Nhập toàn bộ nội dung điều khoản tại đây..."
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="w-full flex-1 px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all resize-none font-mono disabled:opacity-70 disabled:bg-gray-100"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#F8F9FA]">
        {isViewMode ? (
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-900 focus:outline-none transition-colors shadow-sm"
          >
            Đóng
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7B42FF] rounded-lg hover:bg-[#6834E0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7B42FF] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? "Lưu thay đổi" : "Tạo điều khoản"}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
