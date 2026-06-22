"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { MediaResponse } from "@/features/creator-dashboard/api/creator-content-api";
import {
  cancelVideoUpload as cancelVideoUploadSession,
  completeVideoUpload,
  createVideoUploadSession,
  failVideoUpload,
  getVideoUploadSession,
  pauseVideoUpload as pauseVideoUploadSession,
  updateVideoUploadProgress,
  type MediaProtectionType,
  type MediaProvider,
  type MediaUploadSessionStatus,
  type VideoUploadSessionResponse,
} from "@/features/creator-dashboard/api/video-upload-api";
import { uploadToS3 } from "@/features/creator-dashboard/api/s3-upload-api";

const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024;
const STORAGE_PREFIX = "talex.video-upload";
const EXPIRY_SAFETY_WINDOW_MS = 60 * 1000;
const RETRY_DELAYS_MS = [750, 1500];

export type ResumableVideoUploadStatus =
  | "idle"
  | "ready"
  | "preparing"
  | "uploading"
  | "paused"
  | "failed"
  | "completed"
  | "cancelled";

export type PersistedVideoUpload = {
  uploadSessionId: string;
  provider: MediaProvider;
  mediaId: string;
  episodeId: string;
  uploadUrl: string;
  uploadUniqueId?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
  publicId: string;
  resourceType?: string;
  providerDeliveryType?: string;
  uploadParams?: Record<string, string>;
  fileName: string;
  fileSize: number;
  mimeType: string;
  chunkSize: number;
  uploadedBytes: number;
  lastUploadedChunkIndex: number;
  status: MediaUploadSessionStatus;
  completedCloudinaryResponse?: CompletedCloudinaryUploadResponse;
  expiredAt?: string;
  lastModified?: number;
  updatedAt: string;
};

export type UseResumableVideoUploadOptions = {
  episodeId: string;
  creatorId?: string;
  actorId?: string;
  protectionType?: MediaProtectionType;
  onCompleted?: (media: MediaResponse) => void;
};

type CloudinaryChunkResponse = {
  done?: boolean;
  asset_id?: string;
  public_id?: string;
  secure_url?: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  duration?: number;
  width?: number;
  height?: number;
  error?: {
    message?: string;
  };
};

type CompletedCloudinaryUploadResponse = Omit<
  CloudinaryChunkResponse,
  "done" | "error"
> & {
  secure_url: string;
};

class UploadPipelineError extends Error {
  readonly shouldFailSession: boolean;

  constructor(message: string, shouldFailSession = false) {
    super(message);
    this.name = "UploadPipelineError";
    this.shouldFailSession = shouldFailSession;
  }
}

function toStorageKey(episodeId: string) {
  return `${STORAGE_PREFIX}.${episodeId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePersistedUpload(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!isRecord(parsed)) {
      return null;
    }

    if (
      typeof parsed.uploadSessionId !== "string" ||
      typeof parsed.uploadUrl !== "string" ||
      typeof parsed.uploadUniqueId !== "string" ||
      typeof parsed.publicId !== "string" ||
      typeof parsed.fileName !== "string" ||
      typeof parsed.fileSize !== "number" ||
      typeof parsed.chunkSize !== "number"
    ) {
      return null;
    }

    return parsed as PersistedVideoUpload;
  } catch {
    return null;
  }
}

function toPersistedUpload(
  session: VideoUploadSessionResponse,
  file: File,
): PersistedVideoUpload {
  return {
    uploadSessionId: session.uploadSessionId,
    provider: session.provider,
    mediaId: session.mediaId,
    episodeId: session.episodeId,
    uploadUrl: session.uploadUrl,
    uploadUniqueId: session.uploadUniqueId,
    apiKey: session.apiKey,
    timestamp: session.timestamp,
    signature: session.signature,
    publicId: session.publicId,
    resourceType: session.resourceType,
    providerDeliveryType: session.providerDeliveryType,
    uploadParams: session.uploadParams,
    fileName: session.fileName,
    fileSize: session.fileSize,
    mimeType: session.mimeType,
    chunkSize: session.chunkSize || DEFAULT_CHUNK_SIZE,
    uploadedBytes: session.uploadedBytes ?? 0,
    lastUploadedChunkIndex: session.lastUploadedChunkIndex ?? -1,
    status: session.status,
    expiredAt: session.expiredAt,
    lastModified: file.lastModified,
    updatedAt: new Date().toISOString(),
  };
}

function isSameFile(upload: PersistedVideoUpload | null, file: File) {
  if (!upload) {
    return false;
  }

  return (
    upload.fileName === file.name &&
    upload.fileSize === file.size &&
    (!upload.lastModified || upload.lastModified === file.lastModified)
  );
}

function isUploadExpired(upload: PersistedVideoUpload | null) {
  if (!upload?.expiredAt) {
    return false;
  }

  const expiresAt = Date.parse(upload.expiredAt);
  return Number.isFinite(expiresAt)
    ? Date.now() + EXPIRY_SAFETY_WINDOW_MS >= expiresAt
    : false;
}

async function readCloudinaryError(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = (await response.json()) as CloudinaryChunkResponse;
    return body.error?.message || response.statusText;
  }

  return response.text();
}

function appendSignedUploadParams(
  formData: FormData,
  upload: PersistedVideoUpload,
) {
  Object.entries(upload.uploadParams ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.set(key, value);
    }
  });

  formData.set("api_key", upload.apiKey ?? "");
  formData.set("signature", upload.signature ?? "");
  formData.set("timestamp", String(upload.timestamp ?? ""));
  formData.set("public_id", upload.publicId);

  if (upload.providerDeliveryType && !formData.has("type")) {
    formData.set("type", upload.providerDeliveryType);
  }
}

async function uploadCloudinaryChunk({
  upload,
  file,
  chunk,
  start,
  end,
  signal,
}: {
  upload: PersistedVideoUpload;
  file: File;
  chunk: Blob;
  start: number;
  end: number;
  signal: AbortSignal;
}) {
  const formData = new FormData();
  formData.set("file", chunk, file.name);
  appendSignedUploadParams(formData, upload);

  const response = await fetch(upload.uploadUrl, {
    method: "POST",
    headers: {
      "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
      "X-Unique-Upload-Id": upload.uploadUniqueId,
    },
    body: formData,
    signal,
  });

  if (!response.ok) {
    const errorMessage = await readCloudinaryError(response);
    const isPermanentClientError =
      response.status >= 400 &&
      response.status < 500 &&
      ![408, 409, 425, 429].includes(response.status);

    throw new UploadPipelineError(
      `Cloudinary chunk upload failed (${response.status}): ${errorMessage}`,
      isPermanentClientError,
    );
  }

  return (await response.json()) as CloudinaryChunkResponse;
}

function toCompletedCloudinaryResponse(
  response: CloudinaryChunkResponse,
): CompletedCloudinaryUploadResponse | null {
  if (!response.secure_url) {
    return null;
  }

  return {
    asset_id: response.asset_id,
    public_id: response.public_id,
    secure_url: response.secure_url,
    resource_type: response.resource_type,
    format: response.format,
    bytes: response.bytes,
    duration: response.duration,
    width: response.width,
    height: response.height,
  };
}

function isRetryableUploadError(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false;
  }

  if (error instanceof UploadPipelineError) {
    return !error.shouldFailSession;
  }

  return true;
}

function shouldFailRemoteSession(error: unknown) {
  return error instanceof UploadPipelineError && error.shouldFailSession;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function withUploadRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableUploadError(error) || attempt === RETRY_DELAYS_MS.length) {
        throw error;
      }

      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Upload was stopped.";
  }

  return error instanceof Error ? error.message : "Video upload failed.";
}

export function useResumableVideoUpload({
  episodeId,
  creatorId,
  actorId,
  protectionType = "SIGNED_URL",
  onCompleted,
}: UseResumableVideoUploadOptions) {
  const storageKey = useMemo(() => toStorageKey(episodeId), [episodeId]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeUpload, setActiveUpload] =
    useState<PersistedVideoUpload | null>(null);
  const [persistedUpload, setPersistedUpload] =
    useState<PersistedVideoUpload | null>(() => {
      if (typeof window === "undefined") {
        return null;
      }

      const storedUpload = parsePersistedUpload(
        localStorage.getItem(toStorageKey(episodeId)),
      );

      return isUploadExpired(storedUpload) ? null : storedUpload;
    });
  const [status, setStatus] = useState<ResumableVideoUploadStatus>(() => {
    if (typeof window === "undefined") {
      return "idle";
    }

    const storedUpload = parsePersistedUpload(
      localStorage.getItem(toStorageKey(episodeId)),
    );

    return storedUpload &&
      !isUploadExpired(storedUpload) &&
      !["COMPLETED", "CANCELLED", "EXPIRED"].includes(storedUpload.status)
      ? "paused"
      : "idle";
  });
  const [uploadedBytes, setUploadedBytes] = useState(() => {
    if (typeof window === "undefined") {
      return 0;
    }

    const storedUpload = parsePersistedUpload(
      localStorage.getItem(toStorageKey(episodeId)),
    );

    return isUploadExpired(storedUpload) ? 0 : (storedUpload?.uploadedBytes ?? 0);
  });
  const [speedBytesPerSecond, setSpeedBytesPerSecond] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pauseRequestedRef = useRef(false);
  const cancelRequestedRef = useRef(false);

  const persistUpload = useCallback(
    (nextUpload: PersistedVideoUpload | null) => {
      setPersistedUpload(nextUpload);

      if (typeof window === "undefined") {
        return;
      }

      if (!nextUpload) {
        localStorage.removeItem(storageKey);
        return;
      }

      localStorage.setItem(storageKey, JSON.stringify(nextUpload));
    },
    [storageKey],
  );

  const markProgress = useCallback(
    (
      upload: PersistedVideoUpload,
      nextUploadedBytes: number,
      lastUploadedChunkIndex: number,
      nextStatus: MediaUploadSessionStatus = "UPLOADING",
    ) => {
      const nextUpload = {
        ...upload,
        uploadedBytes: nextUploadedBytes,
        lastUploadedChunkIndex,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      };

      setActiveUpload(nextUpload);
      setUploadedBytes(nextUploadedBytes);
      persistUpload(nextUpload);

      return nextUpload;
    },
    [persistUpload],
  );

  const rememberCompletedCloudinaryResponse = useCallback(
    (
      upload: PersistedVideoUpload,
      response: CompletedCloudinaryUploadResponse,
    ) => {
      const nextUpload = {
        ...upload,
        completedCloudinaryResponse: response,
        updatedAt: new Date().toISOString(),
      };

      setActiveUpload(nextUpload);
      persistUpload(nextUpload);

      return nextUpload;
    },
    [persistUpload],
  );

  const uploadViaS3 = useCallback(
    async (file: File, upload: PersistedVideoUpload) => {
      setStatus("uploading");
      setSpeedBytesPerSecond(0);

      try {
        const startTime = Date.now();
        await uploadToS3(file, upload.uploadUrl, (progress) => {
          markProgress(upload, progress.loaded, undefined);
          const elapsedMs = Date.now() - startTime;
          if (elapsedMs > 0) {
            setSpeedBytesPerSecond(
              Math.round((progress.loaded / elapsedMs) * 1000),
            );
          }
        });

        const result = await completeVideoUpload(upload.uploadSessionId, {
          uploadSessionId: upload.uploadSessionId,
          publicId: upload.publicId,
          secureUrl: upload.uploadUrl,
          bytes: file.size,
          actorId,
        });

        clearPersistedUpload();
        setStatus("completed");
        setSpeedBytesPerSecond(0);
        onCompleted?.(result);
      } catch (err) {
        if (cancelRequestedRef.current) {
          setStatus("cancelled");
          return;
        }
        const message = getErrorMessage(err);
        setStatus("failed");
        setError(message);
        setSpeedBytesPerSecond(0);
        if (shouldFailRemoteSession(err)) {
          await failVideoUpload(upload.uploadSessionId, {
            errorMessage: message,
            actorId,
          }).catch(() => undefined);
        }
        throw err;
      }
    },
    [
      actorId,
      markProgress,
      clearPersistedUpload,
      onCompleted,
    ],
  );

  const uploadChunks = useCallback(
    async (file: File, upload: PersistedVideoUpload) => {
      let currentUpload = upload;
      let currentUploadedBytes = Math.min(upload.uploadedBytes, file.size);
      let lastUploadedChunkIndex =
        upload.lastUploadedChunkIndex >= 0
          ? upload.lastUploadedChunkIndex
          : Math.ceil(currentUploadedBytes / upload.chunkSize) - 1;
      let finalCloudinaryResponse =
        currentUpload.completedCloudinaryResponse ?? null;
      const baselineBytes = currentUploadedBytes;
      const startedAt = performance.now();

      setStatus("uploading");
      setError(null);
      setUploadedBytes(currentUploadedBytes);

      while (currentUploadedBytes < file.size) {
        if (pauseRequestedRef.current || cancelRequestedRef.current) {
          break;
        }

        const start = currentUploadedBytes;
        const end = Math.min(start + currentUpload.chunkSize, file.size);
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const chunkResponse = await withUploadRetry(() =>
          uploadCloudinaryChunk({
            upload: currentUpload,
            file,
            chunk: file.slice(start, end),
            start,
            end,
            signal: controller.signal,
          }),
        );
        abortControllerRef.current = null;

        currentUploadedBytes = end;
        lastUploadedChunkIndex += 1;
        currentUpload = markProgress(
          currentUpload,
          currentUploadedBytes,
          lastUploadedChunkIndex,
        );
        const completedResponse =
          toCompletedCloudinaryResponse(chunkResponse);
        if (completedResponse) {
          finalCloudinaryResponse = completedResponse;
          currentUpload = rememberCompletedCloudinaryResponse(
            currentUpload,
            completedResponse,
          );
        }

        const elapsedSeconds = Math.max(
          (performance.now() - startedAt) / 1000,
          0.1,
        );
        setSpeedBytesPerSecond(
          Math.round((currentUploadedBytes - baselineBytes) / elapsedSeconds),
        );

        await withUploadRetry(() =>
          updateVideoUploadProgress(currentUpload.uploadSessionId, {
            uploadedBytes: currentUploadedBytes,
            lastUploadedChunkIndex,
            status: "UPLOADING",
            actorId,
          }),
        );
      }

      if (pauseRequestedRef.current || cancelRequestedRef.current) {
        return;
      }

      if (!finalCloudinaryResponse?.secure_url) {
        throw new UploadPipelineError(
          "Cloudinary did not return a completed video URL.",
          true,
        );
      }

      const completedMedia = await withUploadRetry(() =>
        completeVideoUpload(currentUpload.uploadSessionId, {
          assetId: finalCloudinaryResponse.asset_id,
          publicId: finalCloudinaryResponse.public_id || currentUpload.publicId,
          secureUrl: finalCloudinaryResponse.secure_url,
          resourceType:
            finalCloudinaryResponse.resource_type || currentUpload.resourceType,
          format: finalCloudinaryResponse.format,
          bytes: finalCloudinaryResponse.bytes ?? file.size,
          duration: finalCloudinaryResponse.duration,
          width: finalCloudinaryResponse.width,
          height: finalCloudinaryResponse.height,
          actorId,
        }),
      );

      setStatus("completed");
      setUploadedBytes(file.size);
      setSpeedBytesPerSecond(0);
      setActiveUpload(null);
      persistUpload(null);
      onCompleted?.(completedMedia);
    },
    [
      actorId,
      markProgress,
      onCompleted,
      persistUpload,
      rememberCompletedCloudinaryResponse,
    ],
  );

  const selectFile = useCallback(
    (file: File | null) => {
      setError(null);
      setSpeedBytesPerSecond(0);

      if (!file) {
        setSelectedFile(null);
        setActiveUpload(null);
        setUploadedBytes(
          isUploadExpired(persistedUpload)
            ? 0
            : (persistedUpload?.uploadedBytes ?? 0),
        );
        setStatus(
          persistedUpload && !isUploadExpired(persistedUpload)
            ? "paused"
            : "idle",
        );
        return;
      }

      if (!file.type.startsWith("video/")) {
        setSelectedFile(null);
        setActiveUpload(null);
        setUploadedBytes(0);
        setStatus("failed");
        setError("Choose a valid video file.");
        return;
      }

      const resumableUpload =
        isSameFile(persistedUpload, file) && !isUploadExpired(persistedUpload)
          ? persistedUpload
          : null;

      setSelectedFile(file);
      setActiveUpload(resumableUpload);
      setUploadedBytes(resumableUpload?.uploadedBytes ?? 0);
      setStatus(resumableUpload ? "paused" : "ready");
    },
    [persistedUpload],
  );

  const startUpload = useCallback(async () => {
    if (!selectedFile) {
      setStatus("failed");
      setError(
        persistedUpload
          ? "Select the same video file to resume this upload."
          : "Choose a video file before uploading.",
      );
      return;
    }

    pauseRequestedRef.current = false;
    cancelRequestedRef.current = false;
    setStatus("preparing");
    setError(null);

    let upload =
      isSameFile(activeUpload, selectedFile) && !isUploadExpired(activeUpload)
        ? activeUpload
        : null;

    try {
      if (!upload && isSameFile(persistedUpload, selectedFile)) {
        if (isUploadExpired(persistedUpload)) {
          persistUpload(null);
          throw new Error("Upload session expired. Start a new upload session.");
        }

        const remoteUpload = await getVideoUploadSession(
          persistedUpload!.uploadSessionId,
        );

        if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(remoteUpload.status)) {
          persistUpload(null);
          throw new Error(`Upload session is ${remoteUpload.status.toLowerCase()}.`);
        }

        upload = {
          ...persistedUpload!,
          uploadedBytes: remoteUpload.uploadedBytes ?? persistedUpload!.uploadedBytes,
          lastUploadedChunkIndex:
            remoteUpload.lastUploadedChunkIndex ??
            persistedUpload!.lastUploadedChunkIndex,
          status: remoteUpload.status,
          updatedAt: new Date().toISOString(),
        };
      }

      if (!upload) {
        const session = await createVideoUploadSession(episodeId, {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type || "video/mp4",
          chunkSize: DEFAULT_CHUNK_SIZE,
          protectionType,
          creatorId,
          actorId,
        });
        upload = toPersistedUpload(session, selectedFile);
      }

      setActiveUpload(upload);
      persistUpload(upload);
      if (upload.provider === "AWS") {
        await uploadViaS3(selectedFile, upload);
      } else {
        await uploadChunks(selectedFile, upload);
      }
    } catch (uploadError) {
      abortControllerRef.current = null;

      if (pauseRequestedRef.current) {
        const uploadToPause = activeUpload ?? persistedUpload ?? upload;

        if (uploadToPause) {
          await pauseVideoUploadSession(uploadToPause.uploadSessionId, actorId)
            .then((remoteUpload) => {
              markProgress(
                uploadToPause,
                remoteUpload.uploadedBytes ?? uploadToPause.uploadedBytes,
                remoteUpload.lastUploadedChunkIndex ??
                  uploadToPause.lastUploadedChunkIndex,
                "PAUSED",
              );
            })
            .catch(() => {
              markProgress(
                uploadToPause,
                uploadToPause.uploadedBytes,
                uploadToPause.lastUploadedChunkIndex,
                "PAUSED",
              );
            });
        }

        setStatus("paused");
        setSpeedBytesPerSecond(0);
        return;
      }

      if (cancelRequestedRef.current) {
        setStatus("cancelled");
        return;
      }

      const message = getErrorMessage(uploadError);
      setStatus("failed");
      setError(message);
      setSpeedBytesPerSecond(0);

      if (upload && shouldFailRemoteSession(uploadError)) {
        await failVideoUpload(upload.uploadSessionId, {
          errorMessage: message,
          actorId,
        }).catch(() => undefined);
      }
    }
  }, [
    activeUpload,
    actorId,
    creatorId,
    episodeId,
    markProgress,
    persistedUpload,
    persistUpload,
    protectionType,
    selectedFile,
    uploadChunks,
    uploadViaS3,
  ]);

  const pauseUpload = useCallback(async () => {
    pauseRequestedRef.current = true;
    abortControllerRef.current?.abort();

    const upload = activeUpload ?? persistedUpload;

    if (!upload) {
      setStatus("paused");
      return;
    }

    await pauseVideoUploadSession(upload.uploadSessionId, actorId).catch(
      () => undefined,
    );

    markProgress(
      upload,
      uploadedBytes || upload.uploadedBytes,
      upload.lastUploadedChunkIndex,
      "PAUSED",
    );
    setStatus("paused");
    setSpeedBytesPerSecond(0);
  }, [activeUpload, actorId, markProgress, persistedUpload, uploadedBytes]);

  const cancelUpload = useCallback(async () => {
    cancelRequestedRef.current = true;
    abortControllerRef.current?.abort();

    const upload = activeUpload ?? persistedUpload;

    if (upload) {
      await cancelVideoUploadSession(upload.uploadSessionId, actorId).catch(
        () => undefined,
      );
    }

    setStatus("cancelled");
    setSelectedFile(null);
    setActiveUpload(null);
    setUploadedBytes(0);
    setSpeedBytesPerSecond(0);
    setError(null);
    persistUpload(null);
  }, [activeUpload, actorId, persistedUpload, persistUpload]);

  const clearError = useCallback(() => {
    setError(null);
    setStatus(selectedFile ? "ready" : persistedUpload ? "paused" : "idle");
  }, [persistedUpload, selectedFile]);

  const totalBytes = selectedFile?.size ?? persistedUpload?.fileSize ?? 0;
  const progress = totalBytes
    ? Math.min(100, Math.round((uploadedBytes / totalBytes) * 100))
    : 0;

  return {
    selectedFile,
    activeUpload,
    persistedUpload,
    status,
    progress,
    uploadedBytes,
    totalBytes,
    speedBytesPerSecond,
    error,
    isUploading: status === "preparing" || status === "uploading",
    canResume: Boolean(selectedFile && isSameFile(persistedUpload, selectedFile)),
    selectFile,
    startUpload,
    pauseUpload,
    cancelUpload,
    retryUpload: startUpload,
    clearError,
  };
}
