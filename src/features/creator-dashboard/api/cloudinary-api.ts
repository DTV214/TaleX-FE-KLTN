import {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_FOLDER,
  CLOUDINARY_HLS_STREAMING_PROFILE,
  CLOUDINARY_UPLOAD_PRESET,
} from "@/core/config/api";

export type CloudinaryUploadResourceType = "image" | "video";

export type CloudinaryUploadResult = {
  secureUrl: string;
  hlsUrl?: string;
  publicId: string;
  bytes: number;
  format?: string;
  resourceType: CloudinaryUploadResourceType;
  width?: number;
  height?: number;
  duration?: number;
  originalFilename?: string;
};

type CloudinaryRawUploadResponse = {
  secure_url: string;
  public_id: string;
  bytes: number;
  format?: string;
  resource_type: CloudinaryUploadResourceType;
  width?: number;
  height?: number;
  duration?: number;
  original_filename?: string;
};

type CloudinaryErrorResponse = {
  error?: {
    message?: string;
  };
};

function ensureCloudinaryConfig() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Missing Cloudinary config. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to an unsigned upload preset.",
    );
  }
}

function buildUploadEndpoint(resourceType: CloudinaryUploadResourceType) {
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
}

function toHlsUrl(secureUrl: string) {
  if (!secureUrl.includes("/video/upload/")) {
    return secureUrl;
  }

  const transformedUrl = secureUrl.replace(
    "/video/upload/",
    `/video/upload/${CLOUDINARY_HLS_STREAMING_PROFILE}/`,
  );

  return transformedUrl.replace(/\.[^/.?]+($|\?)/, ".m3u8$1");
}

async function readCloudinaryError(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const errorBody = (await response.json()) as CloudinaryErrorResponse;
    return errorBody.error?.message || response.statusText;
  }

  return response.text();
}

export async function uploadToCloudinary(
  file: File,
  resourceType: CloudinaryUploadResourceType,
) {
  ensureCloudinaryConfig();

  if (!file.size) {
    throw new Error("Cannot upload an empty file.");
  }

  if (resourceType === "image" && !file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file.");
  }

  if (resourceType === "video" && !file.type.startsWith("video/")) {
    throw new Error("Please choose a valid video file.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  if (CLOUDINARY_FOLDER) {
    formData.append("folder", CLOUDINARY_FOLDER);
  }

  const response = await fetch(buildUploadEndpoint(resourceType), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorMessage = await readCloudinaryError(response);
    throw new Error(
      `Cloudinary upload failed (${response.status}): ${errorMessage}`,
    );
  }

  const result = (await response.json()) as CloudinaryRawUploadResponse;

  return {
    secureUrl: result.secure_url,
    hlsUrl: resourceType === "video" ? toHlsUrl(result.secure_url) : undefined,
    publicId: result.public_id,
    bytes: result.bytes,
    format: result.format,
    resourceType: result.resource_type,
    width: result.width,
    height: result.height,
    duration: result.duration,
    originalFilename: result.original_filename,
  } satisfies CloudinaryUploadResult;
}
