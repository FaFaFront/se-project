import { Router } from "express";
import { uploadController } from "../controller/upload.controller.js";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: GCS presigned upload URL generation
 */

/**
 * @swagger
 * /upload/presigned-url:
 *   post:
 *     summary: Get a GCS presigned URL for direct file upload
 *     description: >
 *       Returns a V4 signed URL the client can use to PUT a file directly to
 *       Google Cloud Storage (no server-side proxy needed). The client must set
 *       the Content-Type and Content-Length headers exactly as supplied in the
 *       request body. After the upload, persist the returned `publicUrl`.
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             required: [contentType, contentLength]
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [image/jpeg, image/png, image/webp, image/gif]
 *                 example: image/jpeg
 *               contentLength:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10485760
 *                 description: Exact byte size of the file to be uploaded
 *                 example: 204800
 *               folder:
 *                 type: string
 *                 description: >
 *                   Optional bucket sub-folder (e.g. "profile-images").
 *                   Defaults to "users/{userId}" when omitted.
 *                 example: profile-images
 *     responses:
 *       200:
 *         description: Presigned URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Upload URL generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       description: Object path inside the GCS bucket
 *                       example: users/abc123/550e8400-e29b-41d4-a716-446655440000.jpg
 *                     url:
 *                       type: string
 *                       format: uri
 *                       description: Signed URL — PUT the file here
 *                     publicUrl:
 *                       type: string
 *                       format: uri
 *                       description: Public URL to access the file after upload
 *       400:
 *         description: Validation error (invalid content type, size exceeded, unknown fields)
 *       401:
 *         description: Unauthorized
 */
router.post("/presigned-url", authMiddleware, requireActiveAccount, uploadController.getUploadUrl);

export const uploadRouter = router;
