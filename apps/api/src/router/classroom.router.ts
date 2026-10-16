import { Router } from "express";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";
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

router.use(authMiddleware, requireActiveAccount);

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

export const classroomRouter = router;
