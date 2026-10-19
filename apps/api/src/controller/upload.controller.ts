import type { NextFunction, Response } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { successResponse } from "../common/utils/response.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  getExtension,
  getPublicUrl,
  getSignedUploadUrl,
} from "../service/gcs.service.js";

const ContentTypeSchema = z.string().refine(
  (type) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type),
  { message: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed." }
);

const GetUploadUrlSchema = z
  .object({
    contentType: ContentTypeSchema,
    contentLength: z
      .number()
      .int("Content length must be an integer")
      .positive("Content length must be positive")
      .max(MAX_IMAGE_UPLOAD_BYTES, "Image must be 10 MiB or smaller"),
    folder: z.string().optional(),
  })
  .strict();

export const uploadController = {
  /**
   * POST /upload/presigned-url
   * Returns a GCS V4 signed URL the client can PUT to directly.
   * The response also includes the final public URL so the caller
   * can persist it after the upload succeeds.
   */
  async getUploadUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("User not found in request");
      }

      const { contentType, contentLength, folder } = GetUploadUrlSchema.parse(req.body);

      // Build an object key scoped to the authenticated user by default
      const prefix = folder ? folder.replace(/\/$/, "") : `users/${user.id}`;
      const key = `${prefix}/${randomUUID()}.${getExtension(contentType)}`;

      const url = await getSignedUploadUrl(key, contentType, 900, contentLength);
      const publicUrl = getPublicUrl(key);

      res
        .status(200)
        .json(successResponse({ key, url, publicUrl }, "Upload URL generated successfully"));
    } catch (error) {
      next(error);
    }
  },
};
