import {
  httpClient,
  unwrapBaseResponse,
} from "@/shared/api/http-client";

export type ImagePresignedUploadRequest = {
  fileName: string;
  mimeType: string;
  fileSize: number;
  imageContext: "cover" | "banner" | "comic-page" | "avatar";
  entityId?: string;
  actorId?: string;
};

export type ImagePresignedUploadResponse = {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  bucket: string;
  region: string;
};

export async function getImagePresignedUpload(
  request: ImagePresignedUploadRequest,
) {
  return unwrapBaseResponse<ImagePresignedUploadResponse>(
    httpClient.post("/api/v1/media/image/presigned-upload", request),
  );
}

/**
 * Upload image to S3: get presigned URL → PUT file → return public CloudFront URL.
 */
export async function uploadImageToS3(
  file: File,
  imageContext: ImagePresignedUploadRequest["imageContext"],
  entityId?: string,
  actorId?: string,
): Promise<{ publicUrl: string; key: string }> {
  const presigned = await getImagePresignedUpload({
    fileName: file.name,
    mimeType: file.type || "image/jpeg",
    fileSize: file.size,
    imageContext,
    entityId,
    actorId,
  });

  await uploadToS3(file, presigned.uploadUrl);

  return { publicUrl: presigned.publicUrl, key: presigned.key };
}

export type S3UploadResult = {
  etag: string;
  fileSize: number;
};

export type S3UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

/**
 * Upload file to S3 via presigned URL using XMLHttpRequest.
 * Supports progress tracking via onProgress callback.
 */
export function uploadToS3(
  file: File,
  presignedUrl: string,
  onProgress?: (progress: S3UploadProgress) => void,
): Promise<S3UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({
          loaded: e.loaded,
          total: e.total,
          percent: Math.round((e.loaded / e.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("ETag")?.replace(/"/g, "") ?? "";
        resolve({ etag, fileSize: file.size });
      } else {
        reject(new Error(`S3 upload failed (HTTP ${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("S3 upload network error"));
    xhr.ontimeout = () => reject(new Error("S3 upload timed out"));
    xhr.send(file);
  });
}
