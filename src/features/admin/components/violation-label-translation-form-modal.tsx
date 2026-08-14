"use client";

import { Loader2, X } from "lucide-react";
import { type FormEvent } from "react";
import { toast } from "sonner";
import {
  type ViolationLabelTranslation,
  type ViolationLabelTranslationCreatePayload,
} from "@/features/admin/api/violation-label-translation.api";

export function ViolationLabelTranslationFormModal({
  isSaving,
  onClose,
  onSubmit,
  open,
  translation,
}: {
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: ViolationLabelTranslationCreatePayload) => void;
  open: boolean;
  translation: ViolationLabelTranslation | null;
}) {
  if (!open) return null;

  const isEditing = Boolean(translation);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const awsLabel = String(formData.get("awsLabel") ?? "").trim();
    const vietnameseText = String(formData.get("vietnameseText") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();

    if (!isEditing && !awsLabel) {
      toast.error("Nhãn AWS là bắt buộc.");
      return;
    }
    if (!vietnameseText) {
      toast.error("Bản dịch tiếng Việt là bắt buộc.");
      return;
    }

    onSubmit({
      awsLabel: isEditing ? translation!.awsLabel : awsLabel,
      vietnameseText,
      category,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isEditing ? "Chỉnh sửa bản dịch" : "Thêm bản dịch"}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Nhãn vi phạm AWS Rekognition hiển thị cho Creator/Staff.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Nhãn AWS Rekognition
            </span>
            <input
              name="awsLabel"
              defaultValue={translation?.awsLabel ?? ""}
              readOnly={isEditing}
              required={!isEditing}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 read-only:bg-slate-100 read-only:text-slate-500"
              placeholder="Ví dụ: Explicit Nudity"
            />
            {isEditing && (
              <span className="mt-1 block text-xs text-slate-400">
                Không thể sửa — đây là key tra cứu thật từ AWS Rekognition.
              </span>
            )}
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Bản dịch tiếng Việt
            </span>
            <input
              name="vietnameseText"
              defaultValue={translation?.vietnameseText ?? ""}
              required
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              placeholder="Ví dụ: Nội dung khỏa thân lộ liễu"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-slate-700">
              Nhóm (tùy chọn)
            </span>
            <input
              name="category"
              defaultValue={translation?.category ?? ""}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              placeholder="Ví dụ: Violence"
            />
          </label>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}

export function ViolationLabelTranslationConfirmModal({
  isDeleting,
  onClose,
  onConfirm,
  open,
  translation,
}: {
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  translation: ViolationLabelTranslation | null;
}) {
  if (!open || !translation) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-950">Xóa bản dịch?</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
            Nhãn{" "}
            <span className="font-bold text-slate-900">{translation.awsLabel}</span>{" "}
            sẽ mất bản dịch tiếng Việt — Creator/Staff sẽ thấy nhãn gốc tiếng Anh
            cho tới khi có bản dịch khác được thêm lại.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
