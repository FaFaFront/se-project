import { Storage } from "@google-cloud/storage";
import { env } from "../config/env.js";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MiB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * Create a GCS Storage client.
 * Priority: inline JSON key → key file path → Application Default Credentials
 */
function createStorageClient(): Storage {
  if (env.GCS_SERVICE_ACCOUNT_KEY) {
    const credentials = JSON.parse(env.GCS_SERVICE_ACCOUNT_KEY) as object;
    return new Storage({ projectId: env.GCS_PROJECT_ID || undefined, credentials });
  }
  if (env.GCS_CREDENTIALS_PATH) {
    return new Storage({
      projectId: env.GCS_PROJECT_ID || undefined,
      keyFilename: env.GCS_CREDENTIALS_PATH,
    });
  }
  // Fallback to Application Default Credentials (ADC)
  return new Storage({ projectId: env.GCS_PROJECT_ID || undefined });
}

const storage = createStorageClient();
const bucket = storage.bucket(env.GCS_BUCKET);

export function getExtension(contentType: string): string {
  return EXT_MAP[contentType] ?? "jpg";
}

/**
 * Returns the public access URL for a given object key.
 * Uses GCS_PUBLIC_BASE_URL if set (e.g. a CDN or custom domain),
 * otherwise falls back to the default GCS public URL.
 */
export function getPublicUrl(key: string): string {
  if (env.GCS_PUBLIC_BASE_URL) {
    const base = env.GCS_PUBLIC_BASE_URL.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  return `https://storage.googleapis.com/${env.GCS_BUCKET}/${key}`;
}

/**
 * Generate a GCS V4 signed URL for a PUT (upload) operation.
 *
 * @param key            - Object path inside the bucket (e.g. "users/abc/logo.jpg")
 * @param contentType    - MIME type that must be set by the uploader
 * @param expiresInSecs  - Seconds until the signed URL expires (default 15 min)
 * @param contentLength  - Optional exact byte count locked into the signature
 * @returns              Signed upload URL (PUT to this URL directly from the client)
 */
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSecs = 900,
  contentLength?: number
): Promise<string> {
  const extensionHeaders: Record<string, string> = {};
  if (contentLength !== undefined) {
    extensionHeaders["Content-Length"] = String(contentLength);
  }

  const [url] = await bucket.file(key).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + expiresInSecs * 1000,
    contentType,
    ...(Object.keys(extensionHeaders).length > 0 ? { extensionHeaders } : {}),
  });

  return url;
}
