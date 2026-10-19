import { apiClient } from "@/lib/api-client";

interface PresignedUploadResponse {
  key: string;
  url: string;
  publicUrl: string;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Uploads an image file directly to Google Cloud Storage via a backend presigned URL.
 *
 * @param file   The image file to upload
 * @param folder Optional subfolder under the authenticated user's bucket path (e.g. "avatars")
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToGCS(file: File, folder = "avatars"): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    throw new Error("Invalid file type. Only JPG, PNG, WebP, and GIF are allowed.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("File size must be 10 MB or smaller.");
  }

  // 1. Request presigned upload URL from backend
  const { url, publicUrl } = await apiClient.post<PresignedUploadResponse>(
    "/upload/presigned-url",
    {
      contentType: file.type,
      contentLength: file.size,
      folder,
    }
  );

  // 2. Upload file directly to GCS using HTTP PUT
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
      credentials: "omit",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to upload image to storage (${response.status} ${response.statusText})`
      );
    }
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        "Upload blocked by CORS. Please enable CORS on your GCS bucket (see instructions in chat)."
      );
    }
    throw error;
  }

  return publicUrl;
}
