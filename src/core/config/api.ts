export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8080";

export const SWAGGER_URL = `${API_BASE_URL}/swagger-ui/index.html#/`;

export const CREATOR_DASHBOARD_CREATOR_ID =
  process.env.NEXT_PUBLIC_CREATOR_ID || "1";

export const CREATOR_DASHBOARD_ACTOR_ID =
  process.env.NEXT_PUBLIC_ACTOR_ID || CREATOR_DASHBOARD_CREATOR_ID;

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

export const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";

export const CLOUDINARY_FOLDER =
  process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "";

export const CLOUDINARY_HLS_STREAMING_PROFILE =
  process.env.NEXT_PUBLIC_CLOUDINARY_HLS_STREAMING_PROFILE || "sp_auto";
