"use client";

import { useState, type FormEvent } from "react";
import { X, Loader2, Save, AlertCircle } from "lucide-react";
import {
  useTermsVersion,
  useCreateTermsVersion,
  useUpdateTermsVersion,
} from "../hooks/useTermsQueries";
import { TermsType, CreateTermsPayload } from "../types/terms.types";

interface TermsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

const initialFormState: CreateTermsPayload = {
  version: "",
  type: "CREATOR",
  content: "",
  isActive: false,
};

function getMutationErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred. Please try again.";
}

export function TermsFormModal({
  isOpen,
  onClose,
  editId,
}: TermsFormModalProps) {
  const isEditMode = !!editId;
  const { data: detailResponse, isLoading: isFetchingDetail } = useTermsVersion(
    isOpen && editId ? editId : "",
  );

  const createMutation = useCreateTermsVersion();
  const updateMutation = useUpdateTermsVersion();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const initialData =
    isEditMode && detailResponse?.data
      ? {
          version: detailResponse.data.version,
          type: detailResponse.data.type,
          content: detailResponse.data.content,
          isActive: detailResponse.data.isActive,
        }
      : initialFormState;

  const formKey = isEditMode
    ? `edit-${editId}-${detailResponse?.data?.updatedAt ?? detailResponse?.data?.createdAt ?? "loading"}`
    : "create";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={!isSaving ? onClose : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#F8F9FA]">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditMode ? "Edit Terms Version" : "Create New Terms Version"}
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

        {isEditMode && isFetchingDetail ? (
          <div className="flex flex-col items-center justify-center p-12 flex-1">
            <Loader2 className="w-8 h-8 text-[#7B42FF] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading term details...</p>
          </div>
        ) : (
          <TermsForm
            key={formKey}
            initialData={initialData}
            isEditMode={isEditMode}
            editId={editId}
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

type TermsFormProps = {
  initialData: CreateTermsPayload;
  isEditMode: boolean;
  editId?: string | null;
  isSaving: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTermsPayload) => Promise<unknown>;
  onUpdate: (id: string, payload: CreateTermsPayload) => Promise<unknown>;
};

function TermsForm({
  initialData,
  isEditMode,
  editId,
  isSaving,
  onClose,
  onCreate,
  onUpdate,
}: TermsFormProps) {
  const [formData, setFormData] = useState<CreateTermsPayload>(initialData);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.version.trim() || !formData.content.trim()) {
      setErrorMsg("Version and Content are required fields.");
      return;
    }

    try {
      if (isEditMode && editId) {
        await onUpdate(editId, formData);
      } else {
        await onCreate(formData);
      }
      onClose();
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
              Version Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., 1.0 or 2024-V1"
              value={formData.version}
              onChange={(e) =>
                setFormData({ ...formData, version: e.target.value })
              }
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Term Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as TermsType,
                })
              }
              disabled={isEditMode}
              className="w-full px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="CREATOR">Creator Terms</option>
              <option value="GENERAL_TOS">General Terms of Service</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-[#F8F9FA]/50">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Set as Active
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Activating this will automatically apply it as the current
              official terms.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#7B42FF]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00A389]"></div>
          </label>
        </div>

        <div className="space-y-1.5 flex-1 flex flex-col">
          <label className="text-sm font-semibold text-gray-700">
            Content (HTML/Markdown) <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={10}
            placeholder="Enter the full terms and conditions here..."
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="w-full flex-1 px-3 py-2 bg-[#F8F9FA] border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#7B42FF]/20 focus:border-[#7B42FF] transition-all resize-none font-mono"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-[#F8F9FA]">
        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#7B42FF] rounded-lg hover:bg-[#6834E0] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7B42FF] transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditMode ? "Save Changes" : "Create Term"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
