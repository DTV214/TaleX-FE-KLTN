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
