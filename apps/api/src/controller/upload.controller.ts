import type { NextFunction, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
  uploadService,
} from "../service/upload.service.js";

const ContentTypeSchema = z
  .string()
  .refine((type) => (ALLOWED_IMAGE_TYPES as readonly string[]).includes(type), {
    message: "Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.",
  });

const FolderSchema = z
  .string()
  .trim()
  .min(1, "Folder name cannot be empty")
  .max(100, "Folder name must be 100 characters or fewer")
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Folder name must only contain alphanumeric characters, dashes, or underscores"
  )
  .optional();

const GetUploadUrlSchema = z
  .object({
    contentType: ContentTypeSchema,
    contentLength: z
      .number()
      .int("Content length must be an integer")
      .positive("Content length must be positive")
      .max(MAX_IMAGE_UPLOAD_BYTES, "Image must be 10 MiB or smaller"),
    folder: FolderSchema,
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

      const input = GetUploadUrlSchema.parse(req.body);
      // The key is always scoped under the authenticated user, never a client-supplied ID.
      const upload = await uploadService.createPresignedUpload(user.id, input);

      res.status(200).json(successResponse(upload, "Upload URL generated successfully"));
    } catch (error) {
      next(error);
    }
  },
};
