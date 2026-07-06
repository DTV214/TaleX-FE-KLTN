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

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (disabled || upload.isUploading) {
      return;
    }

    upload.selectFile(event.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div className="space-y-6">
      <label
        className={`mb-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed ${
          disabled || upload.isUploading ? 'opacity-50 cursor-not-allowed border-creator-border bg-creator-bg' : 'border-creator-gold/30 bg-[#13110F] hover:bg-creator-bg transition group'
        } p-8 text-center`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="video/*"
          className="hidden"
          disabled={disabled || upload.isUploading}
          onChange={handleInputChange}
        />
        {previewUrl ? (
          <div className="overflow-hidden rounded-xl bg-black shadow-sm w-full relative z-10">
            <video
              src={previewUrl}
              controls
              className="aspect-video w-full bg-black object-contain"
            />
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-creator-bg rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UploadCloud size={28} className="text-creator-gold" />
            </div>
            <p className="text-lg font-bold text-white mb-2">Kéo và thả video của bạn vào đây</p>
            <p className="text-sm text-creator-muted max-w-sm mb-6">Hoặc nhấp để tải lên từ máy tính. Khuyên dùng MP4 và MOV.</p>
            <div className="px-6 py-2.5 bg-white/5 group-hover:bg-white/10 rounded-md text-sm font-medium transition-colors border border-creator-border text-white">
              Select Video
            </div>
          </>
        )}
      </label>

      {upload.selectedFile && !previewUrl && (
        <p className="text-sm font-bold text-creator-gold text-center">
          Selected: {upload.selectedFile.name}
        </p>
      )}

      {!upload.selectedFile && upload.persistedUpload && (
        <p className="text-sm font-bold text-creator-gold text-center">
          Pending upload: {upload.persistedUpload.fileName}
        </p>
      )}

      {(upload.isUploading || upload.status === "paused" || upload.status === "completed" || upload.progress > 0) && (
        <div className="rounded-xl border border-creator-border bg-creator-sidebar p-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-sm font-bold text-white">
            <span>{statusText[upload.status]}</span>
            <span>{upload.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-creator-bg border border-creator-border">
            <div
              className="h-full rounded-full bg-creator-gold transition-all"
              style={{ width: `${upload.progress}%` }}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-creator-muted">
            <span>
              {formatBytes(upload.uploadedBytes)} / {formatBytes(upload.totalBytes)}
            </span>
            {upload.speedBytesPerSecond > 0 && (
              <span>{formatBytes(upload.speedBytesPerSecond)}/s</span>
            )}
          </div>
        </div>
      )}

      {disabledReason && (
        <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-500">
          {disabledReason}
        </div>
      )}

      {upload.error && (
        <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-400">
          {upload.error}
        </div>
      )}

      {upload.status === "completed" && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/50 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          Video uploaded. Processing playback now.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3 pt-2">
        <button
          type="button"
          onClick={primaryAction.action}
          disabled={disabled || upload.isUploading || !upload.selectedFile}
          className="flex py-3 items-center justify-center gap-2 rounded-md bg-creator-gold px-4 text-sm font-bold text-black hover:bg-creator-gold-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-2"
        >
          <PrimaryIcon className="h-4 w-4" />
          {upload.isUploading ? "Uploading..." : primaryAction.label}
        </button>

        {upload.isUploading ? (
          <button
            type="button"
            onClick={upload.pauseUpload}
            className="flex py-3 items-center justify-center gap-2 rounded-md border border-creator-border bg-white/5 hover:bg-white/10 px-4 text-sm font-medium text-white transition-colors"
          >
            <PauseCircle className="h-4 w-4" />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={upload.cancelUpload}
            disabled={!upload.persistedUpload && !upload.selectedFile}
            className="flex py-3 items-center justify-center gap-2 rounded-md border border-creator-border bg-white/5 hover:bg-white/10 px-4 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
