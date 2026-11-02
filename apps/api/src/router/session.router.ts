import { Router } from "express";
import {
  authMiddleware,
  requireActiveAccount,
  requireRole,
} from "../common/middleware/auth.middleware.js";
import { sessionController } from "../controller/session.controller.js";

export const sessionRouter = Router();

/**
 * @swagger
 * /sessions/{sessionId}:
 *   get:
 *     summary: Get a session as an assigned participant
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200: { description: Session details, content: { application/json: { schema: { type: object, properties: { success: { type: boolean }, message: { type: string }, data: { $ref: '#/components/schemas/Session' } } } } } }
 *       404: { description: Session missing or not assigned to the caller }
 * /sessions/{sessionId}/attendance:
 *   post:
 *     summary: Record the authenticated participant's first Jitsi join
 *     description: Accepts an empty JSON object only, during the scheduled interval. Browser reports are trusted.
 *     tags: [Sessions]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: sessionId, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content: { application/json: { schema: { type: object, additionalProperties: false } } }
 *     responses:
 *       200: { description: Attendance saved, content: { application/json: { schema: { type: object, properties: { success: { type: boolean }, message: { type: string }, data: { $ref: '#/components/schemas/Session' } } } } } }
 *       400: { description: Outside attendance window, terminal session, or invalid body }
 *       404: { description: Session missing or not assigned to the caller }
 */
sessionRouter.get(
  "/:sessionId",
  authMiddleware,
  requireActiveAccount,
  sessionController.getSession
);
sessionRouter.post(
  "/:sessionId/attendance",
  authMiddleware,
  requireActiveAccount,
  sessionController.recordAttendance
);

/**
 * @swagger
 * /sessions/{sessionId}/cancel:
 *   patch:
 *     summary: Cancel a scheduled or ongoing session
 *     description: >
 *       Only the tutor who owns the classroom can cancel a session.
 *       The session must be in `scheduled` or `ongoing` status.
 *       Cancelled sessions are never charged.
 *       Cancellation closes fifteen minutes after scheduled end; payment-pending sessions cannot be cancelled.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Session cancelled successfully }
 *                 data: { $ref: '#/components/schemas/Session' }
 *       400: { description: Session status is not cancellable }
 *       401: { description: Missing or invalid authentication }
 *       403: { description: Inactive account, not a tutor, or not this classroom's tutor }
 *       404: { description: Session not found }
 */
sessionRouter.patch(
  "/:sessionId/cancel",
  authMiddleware,
  requireActiveAccount,
  requireRole("tutor"),
  sessionController.cancelSession
);
