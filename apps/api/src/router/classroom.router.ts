import { Router } from "express";
import {
  authMiddleware,
  requireActiveAccount,
  requireRole,
} from "../common/middleware/auth.middleware.js";
import { classroomController } from "../controller/classroom.controller.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateClassroomRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [conversationId, subjectId]
 *       properties:
 *         conversationId:
 *           type: string
 *           format: uuid
 *           description: Conversation identifying the student (the other participant).
 *         subjectId:
 *           type: string
 *           format: uuid
 *           description: Subject assigned to the authenticated tutor.
 *         pricePerHour:
 *           type: number
 *           minimum: 0.01
 *           description: Classroom-specific price override. Defaults to the tutor's hourlyRate when omitted.
 *     Classroom:
 *       type: object
 *       additionalProperties: false
 *       required: [id, tutorId, studentId, subjectId, pricePerHour, status, createdAt]
 *       properties:
 *         id: { type: string, format: uuid }
 *         tutorId: { type: string, format: uuid }
 *         studentId: { type: string, format: uuid }
 *         subjectId: { type: string, format: uuid }
 *         pricePerHour: { type: number, example: 25 }
 *         status: { type: string, enum: [active, completed] }
 *         createdAt: { type: string, format: date-time }
 */

const router = Router();

router.use(authMiddleware, requireActiveAccount, requireRole("tutor"));

/**
 * @swagger
 * /classrooms:
 *   post:
 *     summary: Create a classroom from a student conversation
 *     description: >
 *       Only an active tutor can create a classroom, and only from a conversation
 *       they participate in. The student is derived from the other participant
 *       in that conversation. The subject must already be assigned to the tutor.
 *       When pricePerHour is omitted, the tutor's default hourlyRate is used.
 *     tags: [Classroom]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClassroomRequest'
 *     responses:
 *       201:
 *         description: Classroom created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/Classroom'
 *       400:
 *         description: Invalid input, subject not assigned to tutor, other participant is not a student, or no valid price available
 *       401:
 *         description: Missing or invalid JWT, or the authenticated account was deleted
 *       403:
 *         description: Only active tutors can create classrooms
 *       404:
 *         description: Conversation not found or the authenticated tutor is not a participant
 */
router.post("/", classroomController.createClassroom);

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
 *       401: { description: "Missing or invalid JWT, or the authenticated account no longer exists" }
 *       403: { description: "Inactive account, student, or tutor not assigned to this classroom" }
 *       404: { description: Classroom not found }
 *       409: { description: Classroom changed concurrently and could not be completed; retry the request }
 *       500: { description: Unexpected server error }
 */
router.patch("/:classroomId/deactivate", classroomController.deactivate);

export const classroomRouter = router;
