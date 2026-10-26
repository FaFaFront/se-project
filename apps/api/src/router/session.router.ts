import { Router } from "express";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";
import { sessionController } from "../controller/session.controller.js";

export const sessionRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassroomSessionItem:
 *       type: object
 *       description: A classroom session as listed to its participants. Never includes the Meet link.
 *       properties:
 *         id: { type: string, format: uuid }
 *         scheduledAt: { type: string, format: date-time }
 *         endsAt:
 *           type: string
 *           format: date-time
 *           description: scheduledAt + durationHours. The join window closes here.
 *         joinWindowOpensAt:
 *           type: string
 *           format: date-time
 *           description: 10 minutes before scheduledAt.
 *         durationHours: { type: number, example: 1.5 }
 *         status: { type: string, enum: [scheduled, ongoing, completed, cancelled] }
 *         cost:
 *           type: string
 *           example: "60.00"
 *           description: pricePerHour × durationHours, as a 2-decimal string.
 *         canJoinNow:
 *           type: boolean
 *           description: >
 *             Status is scheduled/ongoing and now is inside the join window. A UI hint only — it
 *             does not check the student's balance, which the join endpoint does.
 *         viewerHasJoined:
 *           type: boolean
 *           description: Whether the authenticated participant has joined this session before.
 *     ClassroomSessionList:
 *       type: object
 *       properties:
 *         upcoming:
 *           type: array
 *           description: Scheduled/ongoing sessions that haven't ended, soonest first.
 *           items: { $ref: '#/components/schemas/ClassroomSessionItem' }
 *         past:
 *           type: array
 *           description: Ended, completed, or cancelled sessions, most recent first.
 *           items: { $ref: '#/components/schemas/ClassroomSessionItem' }
 *     JoinSessionResponse:
 *       type: object
 *       properties:
 *         sessionId: { type: string, format: uuid }
 *         meetLink: { type: string, example: "https://meet.google.com/abc-defg-hij" }
 *     InsufficientBalanceError:
 *       type: object
 *       properties:
 *         success: { type: boolean, example: false }
 *         message: { type: string, example: Insufficient balance to join this session }
 *         code: { type: string, enum: [INSUFFICIENT_BALANCE] }
 *         data:
 *           type: object
 *           properties:
 *             required:
 *               type: string
 *               example: "60.00"
 *               description: This session's cost.
 *             available:
 *               type: string
 *               example: "25.00"
 *               description: >
 *                 walletBalance minus the cost of the student's other joined sessions that are
 *                 not settled yet. Can be negative.
 */

/**
 * @swagger
 * /sessions/{sessionId}/join:
 *   post:
 *     summary: Join a classroom session and get its Meet link
 *     description: >
 *       The only endpoint that returns the Meet link. The caller must be the classroom's tutor or
 *       student, the classroom must be active, the session must be scheduled or ongoing, and now
 *       must be within the join window (10 minutes before scheduledAt until scheduledAt +
 *       durationHours). A student's first join also requires an available balance of at least
 *       the session cost. The first successful join records tutorJoinedAt/studentJoinedAt and
 *       moves a scheduled session to ongoing; re-joining returns the link again without
 *       changing those values.
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
 *         description: Joined; returns the Meet link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Session joined successfully }
 *                 data: { $ref: '#/components/schemas/JoinSessionResponse' }
 *       400: { description: Malformed session ID or a non-empty request body }
 *       401: { description: Missing or invalid authentication }
 *       402:
 *         description: The student's available balance does not cover the session cost
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/InsufficientBalanceError' }
 *       403: { description: The user's account is not active }
 *       404: { description: Session not found, or the user is not a participant of its classroom }
 *       409: { description: Classroom inactive, session not joinable, or outside the join window }
 */
sessionRouter.post(
  "/:sessionId/join",
  authMiddleware,
  requireActiveAccount,
  sessionController.joinSession
);
