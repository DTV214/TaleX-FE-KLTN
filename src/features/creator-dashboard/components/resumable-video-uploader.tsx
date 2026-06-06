"use client";

import {
  CheckCircle2,
  FileVideo,
  PauseCircle,
  PlayCircle,
  RotateCw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, type ChangeEvent, type DragEvent } from "react";
import type { MediaResponse } from "@/features/creator-dashboard/api/creator-content-api";
import {
  useResumableVideoUpload,
  type ResumableVideoUploadStatus,
} from "@/features/creator-dashboard/hooks/use-resumable-video-upload";

type ResumableVideoUploaderProps = {
  episodeId: string;
  creatorId?: string;
  actorId?: string;
  disabledReason?: string;
  onCompleted?: (media: MediaResponse) => void;
};

const statusText: Record<ResumableVideoUploadStatus, string> = {
  idle: "Ready",
  ready: "Ready",
  preparing: "Preparing upload",
  uploading: "Uploading",
  paused: "Paused",
  failed: "Failed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatBytes(bytes: number) {
  if (!bytes) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function ResumableVideoUploader({
  episodeId,
  creatorId,
  actorId,
  disabledReason,
  onCompleted,
}: ResumableVideoUploaderProps) {
  const upload = useResumableVideoUpload({
    episodeId,
    creatorId,
    actorId,
    protectionType: "SIGNED_URL",
    onCompleted,
  });
  const disabled = Boolean(disabledReason);
  const previewUrl = useMemo(
    () => (upload.selectedFile ? URL.createObjectURL(upload.selectedFile) : null),
    [upload.selectedFile],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const primaryAction = useMemo(() => {
    if (upload.status === "failed") {
      return {
        label: "Retry Upload",
        icon: RotateCw,
        action: upload.retryUpload,
      };
    }

    if (upload.status === "paused" && upload.selectedFile) {
      return {
        label: "Resume Upload",
        icon: PlayCircle,
        action: upload.startUpload,
      };
    }

    return {
      label: upload.canResume ? "Resume Upload" : "Start Upload",
      icon: UploadCloud,
      action: upload.startUpload,
    };
  }, [
    upload.canResume,
    upload.retryUpload,
    upload.selectedFile,
    upload.startUpload,
    upload.status,
  ]);

  const PrimaryIcon = primaryAction.icon;

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    upload.selectFile(event.target.files?.[0] ?? null);
    event.currentTarget.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (disabled || upload.isUploading) {
      return;
    }

    upload.selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl border border-dashed border-[#E8AFC1] bg-[#F1F5FE] p-5 text-center transition hover:border-[#B83268] hover:bg-[#F8FAFF]"
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="overflow-hidden rounded-xl bg-black shadow-sm">
            <video
              src={previewUrl}
              controls
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
        ) : (
          <div className="py-6">
            <FileVideo className="mx-auto mb-4 h-10 w-10 text-[#E85D90]" />
            <p className="text-lg font-black text-[#151A23]">
              Drag and drop video here
            </p>
            <p className="mt-2 text-sm font-semibold text-[#5D5160]">
              Select a video file for this episode.
            </p>
          </div>
        )}

        {upload.selectedFile && (
          <p className="mt-3 text-xs font-black text-[#007A8A]">
            {upload.selectedFile.name}
          </p>
        )}

        {!upload.selectedFile && upload.persistedUpload && (
          <p className="mt-3 text-xs font-black text-[#007A8A]">
            Pending upload: {upload.persistedUpload.fileName}
          </p>
        )}

        <label
          aria-disabled={disabled || upload.isUploading}
          className="mt-5 inline-flex cursor-pointer rounded-full bg-[#B83268] px-5 py-2.5 text-xs font-black text-white aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
        >
          Browse Files
          <input
            type="file"
            accept="video/*"
            className="sr-only"
            disabled={disabled || upload.isUploading}
            onChange={handleInputChange}
          />
        </label>
      </div>

      <div className="rounded-2xl border border-[#E5EAF3] bg-white p-4">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-black text-[#5D5160]">
          <span>{statusText[upload.status]}</span>
          <span>{upload.progress}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[#E5EAF3]">
          <div
            className="h-full rounded-full bg-[#007A8A] transition-all"
            style={{ width: `${upload.progress}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#5D5160]">
          <span>
            {formatBytes(upload.uploadedBytes)} / {formatBytes(upload.totalBytes)}
          </span>
          {upload.speedBytesPerSecond > 0 && (
            <span>{formatBytes(upload.speedBytesPerSecond)}/s</span>
          )}
        </div>
      </div>

      {disabledReason && (
        <div className="rounded-xl border border-[#FFE0A3] bg-[#FFF8E6] px-4 py-3 text-sm font-bold text-[#7A4B00]">
          {disabledReason}
        </div>
      )}

      {upload.error && (
        <div className="rounded-xl border border-[#FFD8D4] bg-[#FFF7F6] px-4 py-3 text-sm font-bold text-[#B42318]">
          {upload.error}
        </div>
      )}

      {upload.status === "completed" && (
        <div className="flex items-center gap-2 rounded-xl border border-[#C8F7DC] bg-[#F0FFF6] px-4 py-3 text-sm font-bold text-[#047857]">
          <CheckCircle2 className="h-4 w-4" />
          Video uploaded. Processing playback now.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={primaryAction.action}
          disabled={disabled || upload.isUploading || !upload.selectedFile}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#B83268] px-4 text-sm font-black text-white shadow-lg shadow-pink-900/20 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
        >
          <PrimaryIcon className="h-4 w-4" />
          {upload.isUploading ? "Uploading..." : primaryAction.label}
        </button>

        {upload.isUploading ? (
          <button
            type="button"
            onClick={upload.pauseUpload}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E8BBCB] bg-white px-4 text-sm font-black text-[#5D5160]"
          >
            <PauseCircle className="h-4 w-4" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={upload.cancelUpload}
            disabled={!upload.persistedUpload && !upload.selectedFile}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-[#E8BBCB] bg-white px-4 text-sm font-black text-[#5D5160] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
