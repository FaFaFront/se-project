import { Router } from "express";
import {
  authMiddleware,
  requireActiveAccount,
  requireRole,
} from "../common/middleware/auth.middleware.js";
import { sessionController } from "../controller/session.controller.js";

export const sessionRouter = Router();

/** Mounted at /classrooms/:classroomId/sessions (see routes.ts). */
export const classroomSessionRouter = Router({ mergeParams: true });

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
 *     summary: Record the authenticated participant's first Join Meet button click
 *     description: Accepts an empty JSON object only, during the scheduled interval. This is a button check-in and does not verify conference entry.
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

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateSessionRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [scheduledAt, durationHours]
 *       properties:
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           description: ISO 8601 UTC datetime at least 1 minute in the future.
 *           example: "2026-11-01T09:00:00.000Z"
 *         durationHours:
 *           type: number
 *           description: Duration in hours. Use 0.08333333333333333 for 5 minutes.
 *           enum: [0.08333333333333333, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4]
 *           example: 0.08333333333333333
 *     Session:
 *       type: object
 *       additionalProperties: false
 *       required: [id, classroomId, scheduledAt, durationHours, status, meetLink]
 *       properties:
 *         id: { type: string, format: uuid }
 *         classroomId: { type: string, format: uuid }
 *         scheduledAt: { type: string, format: date-time }
 *         durationHours: { type: number, example: 1.5 }
 *         status: { type: string, enum: [scheduled, ongoing, completed, cancelled, missed] }
 *         meetLink: { type: string, format: uri, example: "https://meet.jit.si/se-550e8400-e29b-41d4-a716-446655440000" }
 *         meetSpaceName: { type: string, nullable: true, example: null }
 *         startedAt: { type: string, format: date-time, nullable: true }
 *         endedAt: { type: string, format: date-time, nullable: true }
 *         tutorJoinedAt: { type: string, format: date-time, nullable: true }
 *         studentJoinedAt: { type: string, format: date-time, nullable: true }
 *         amountCharged: { type: string, nullable: true, example: "150.00" }
 *         attendanceTrackingEnabled: { type: boolean }
 *         paymentPending: { type: boolean }
 */

/**
 * @swagger
 * /classrooms/{classroomId}/sessions:
 *   post:
 *     summary: Schedule a session in a classroom
 *     description: >
 *       Creates a Jitsi Meet session for the classroom. The tutor must own the classroom
 *       and it must be active. `scheduledAt` must be at least 1 minute in the future.
 *       Choose 5 minutes or a half-hour increment from 30 minutes through 4 hours.
 *       The new session must not overlap
 *       any non-cancelled session for the same tutor or student.
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateSessionRequest' }
 *     responses:
 *       201:
 *         description: Session scheduled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Session scheduled successfully }
 *                 data: { $ref: '#/components/schemas/Session' }
 *       400: { description: Classroom inactive, time too soon, or invalid duration }
 *       401: { description: Missing or invalid authentication }
 *       403: { description: Inactive account or not a tutor }
 *       404: { description: Classroom not found or not owned by this tutor }
 *       409: { description: Time slot overlaps an existing session }
 */
classroomSessionRouter.post(
  "/",
  authMiddleware,
  requireActiveAccount,
  requireRole("tutor"),
  sessionController.createSession
);
