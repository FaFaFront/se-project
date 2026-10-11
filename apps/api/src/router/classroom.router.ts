import { Router } from "express";
import { classroomController } from "../controller/classroom.controller.js";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";

export const classroomRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ClassroomSubjectSummary:
 *       type: object
 *       required: [id, name]
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, example: Mathematics }
 *     ClassroomParticipantSummary:
 *       type: object
 *       required: [id, name, profileUrl]
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, nullable: true, example: Alex Smith }
 *         profileUrl: { type: string, format: uri, nullable: true }
 *     TutorClassroomDetail:
 *       type: object
 *       required: [id, viewerRole, subject, participant, pricePerHour, status, createdAt]
 *       properties:
 *         id: { type: string, format: uuid }
 *         viewerRole: { type: string, enum: [tutor] }
 *         subject: { $ref: '#/components/schemas/ClassroomSubjectSummary' }
 *         participant: { $ref: '#/components/schemas/ClassroomParticipantSummary' }
 *         pricePerHour: { type: number, example: 750 }
 *         status: { type: string, enum: [active, completed] }
 *         createdAt: { type: string, format: date-time }
 *     StudentClassroomDetail:
 *       type: object
 *       required: [id, viewerRole, subject, participant, pricePerHour, status]
 *       properties:
 *         id: { type: string, format: uuid }
 *         viewerRole: { type: string, enum: [student] }
 *         subject: { $ref: '#/components/schemas/ClassroomSubjectSummary' }
 *         participant: { $ref: '#/components/schemas/ClassroomParticipantSummary' }
 *         pricePerHour: { type: number, example: 750 }
 *         status: { type: string, enum: [active, completed] }
 */

/**
 * @swagger
 * /classrooms/{classroomId}:
 *   get:
 *     summary: Get a classroom visible to the authenticated participant
 *     description: Tutors receive their assigned student's public summary and the creation date. Students receive their assigned tutor's public summary, without the creation date.
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classroomId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role-appropriate classroom detail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classroom retrieved successfully }
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/TutorClassroomDetail'
 *                     - $ref: '#/components/schemas/StudentClassroomDetail'
 *                   discriminator:
 *                     propertyName: viewerRole
 *       400: { description: Malformed classroom ID }
 *       401: { description: Missing or invalid authentication }
 *       403: { description: The user is not assigned to the classroom }
 *       404: { description: Classroom not found }
 */
classroomRouter.get(
  "/:classroomId",
  authMiddleware,
  requireActiveAccount,
  classroomController.getClassroomDetail
);
