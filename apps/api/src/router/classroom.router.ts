import { Router } from "express";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";
import { classroomController } from "../controller/classroom.controller.js";

export const classroomRouter = Router();

/**
 * @swagger
 * /classrooms/{classroomId}/deactivate:
 *   patch:
 *     summary: Deactivate a classroom
 *     description: Only the assigned tutor with an active account may deactivate a classroom. Changes active to completed without deleting any classroom or related data. Repeated requests for a completed classroom return success. Does not cancel sessions, issue refunds, or settle payments.
 *     tags: [Classroom]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: false
 *       description: Omit the body or send an empty object. No classroom fields are accepted.
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: false
 *             example: {}
 *     responses:
 *       200:
 *         description: Classroom completed or already completed; ownership is checked in both cases.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classroom deactivated successfully. }
 *                 data:
 *                   type: object
 *                   additionalProperties: false
 *                   required: [id, status]
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     status: { type: string, enum: [completed] }
 *       400: { description: Malformed classroom UUID or invalid request body }
 *       401: { description: Missing or invalid JWT, or the authenticated account no longer exists }
 *       403: { description: Inactive account, student, or tutor not assigned to this classroom }
 *       404: { description: Classroom not found }
 *       409: { description: Classroom changed concurrently and could not be completed; retry the request }
 *       500: { description: Unexpected server error }
 */
classroomRouter.patch(
  "/:classroomId/deactivate",
  authMiddleware,
  requireActiveAccount,
  classroomController.deactivate
);
