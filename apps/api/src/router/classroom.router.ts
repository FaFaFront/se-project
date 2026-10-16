import { Router } from "express";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";
import { classroomController } from "../controller/classroom.controller.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassroomListItem:
 *       type: object
 *       additionalProperties: false
 *       required: [id, student, subject, pricePerHour, status, createdAt]
 *       properties:
 *         id: { type: string, format: uuid }
 *         student:
 *           type: object
 *           description: Limited student summary; contact details are never included
 *           required: [id, name, profileUrl]
 *           properties:
 *             id: { type: string, format: uuid }
 *             name: { type: string, nullable: true, example: Student Name }
 *             profileUrl: { type: string, format: uri, nullable: true }
 *         subject:
 *           type: object
 *           required: [id, name]
 *           properties:
 *             id: { type: string, format: uuid }
 *             name: { type: string, example: Mathematics }
 *         pricePerHour: { type: number, example: 25 }
 *         status: { type: string, enum: [active, completed] }
 *         createdAt: { type: string, format: date-time, example: "2026-10-14T08:30:00.000Z" }
 */

const router = Router();

/**
 * @swagger
 * /classrooms:
 *   get:
 *     summary: List the authenticated tutor's classrooms
 *     description: >
 *       Returns only classrooms owned by the tutor in the access token; a tutor ID is never
 *       accepted from the client. Search, subject, and status filters combine (AND). Results
 *       are ordered newest first (createdAt desc, then id). An empty array means no match.
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string, maxLength: 100 }
 *         description: Trimmed, case-insensitive match against the student's name or the subject name
 *       - in: query
 *         name: subjectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, completed, all] }
 *         description: Omit or pass "all" to include every status
 *     responses:
 *       200:
 *         description: Classrooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classrooms retrieved successfully. }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ClassroomListItem'
 *       400: { description: Invalid query parameters }
 *       401: { description: Missing or invalid JWT, or the authenticated account was deleted }
 *       403: { description: The authenticated user is not a tutor, or the account is inactive }
 */
router.get("/", authMiddleware, requireActiveAccount, classroomController.listTutorClassrooms);

export const classroomRouter = router;
