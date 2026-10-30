import { Router } from "express";
import {
  authMiddleware,
  requireActiveAccount,
  requireRole,
} from "../common/middleware/auth.middleware.js";
import { classroomController } from "../controller/classroom.controller.js";
import { sessionController } from "../controller/session.controller.js";

export const classroomRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UpdateClassroomRequest:
 *       type: object
 *       additionalProperties: false
 *       required: [subjectId, pricePerHour]
 *       description: Only these fields are editable. Any other key (id, tutorId, studentId, status, createdAt, ...) is rejected with 400.
 *       properties:
 *         subjectId:
 *           type: string
 *           format: uuid
 *           description: Subject assigned to the authenticated tutor.
 *         pricePerHour:
 *           type: number
 *           minimum: 0.01
 *           maximum: 99999999.99
 *           multipleOf: 0.01
 *           example: 40
 *           description: Price for this classroom only. The tutor's default hourly rate is not changed.
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
 *           maximum: 99999999.99
 *           multipleOf: 0.01
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
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classrooms retrieved successfully. }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ClassroomListItem' }
 *       400: { description: Invalid query parameters }
 *       401: { description: Missing or invalid authentication }
 *       403: { description: Only tutors may list classrooms }
 */
classroomRouter.get(
  "/",
  authMiddleware,
  requireActiveAccount,
  classroomController.listTutorClassrooms
);

/**
 * @swagger
 * /classrooms:
 *   post:
 *     summary: Create a classroom from a student conversation
 *     description: The student is derived from the conversation. The subject must be assigned to the tutor. An omitted price uses the tutor's default hourly rate.
 *     tags: [Classrooms]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CreateClassroomRequest' }
 *     responses:
 *       201:
 *         description: Classroom created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classroom created }
 *                 data: { $ref: '#/components/schemas/Classroom' }
 *       400: { description: Invalid classroom data }
 *       401: { description: Missing or invalid authentication }
 *       403: { description: Only active tutors may create classrooms }
 *       404: { description: Conversation not found }
 */
classroomRouter.post(
  "/",
  authMiddleware,
  requireActiveAccount,
  requireRole("tutor"),
  classroomController.createClassroom
);

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
 *       403: { description: The user's account is not active }
 *       404: { description: Classroom not found, or the user is not assigned to it }
 */
classroomRouter.get(
  "/:classroomId",
  authMiddleware,
  requireActiveAccount,
  classroomController.getClassroomDetail
);

/**
 * @swagger
 * /classrooms/{classroomId}:
 *   patch:
 *     summary: Update a classroom's subject and price
 *     description: Only the assigned tutor with an active account may edit an active classroom. Returns the tutor classroom detail with the saved values.
 *     tags: [Classrooms]
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
 *           schema: { $ref: '#/components/schemas/UpdateClassroomRequest' }
 *     responses:
 *       200:
 *         description: Classroom updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Classroom updated successfully }
 *                 data: { $ref: '#/components/schemas/TutorClassroomDetail' }
 *       400: { description: "Malformed classroom ID, invalid or extra body fields, or a subject not assigned to the tutor" }
 *       401: { description: "Missing or invalid JWT, or the authenticated account no longer exists" }
 *       403: { description: "Inactive account or not a tutor" }
 *       404: { description: Classroom not found, or the tutor is not assigned to it }
 *       409: { description: The classroom is completed, or was deactivated during the update }
 */
classroomRouter.patch(
  "/:classroomId",
  authMiddleware,
  requireActiveAccount,
  requireRole("tutor"),
  classroomController.updateClassroom
);

/**
 * @swagger
 * /classrooms/{classroomId}/deactivate:
 *   patch:
 *     summary: Deactivate a classroom
 *     description: Only the assigned tutor with an active account may deactivate a classroom. Changes active to completed without deleting related data. Repeated requests for a completed classroom return success.
 *     tags: [Classrooms]
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
 *       403: { description: "Inactive account or not a tutor" }
 *       404: { description: Classroom not found, or the tutor is not assigned to it }
 *       409: { description: Classroom changed concurrently and could not be completed; retry the request }
 *       500: { description: Unexpected server error }
 */
classroomRouter.patch(
  "/:classroomId/deactivate",
  authMiddleware,
  requireActiveAccount,
  requireRole("tutor"),
  classroomController.deactivate
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
 *           description: ISO 8601 UTC datetime; must be at least 30 minutes in the future.
 *           example: "2026-11-01T09:00:00.000Z"
 *         durationHours:
 *           type: number
 *           minimum: 0.5
 *           maximum: 4
 *           multipleOf: 0.5
 *           example: 1.5
 *     Session:
 *       type: object
 *       additionalProperties: false
 *       required: [id, classroomId, scheduledAt, durationHours, status, meetLink]
 *       properties:
 *         id: { type: string, format: uuid }
 *         classroomId: { type: string, format: uuid }
 *         scheduledAt: { type: string, format: date-time }
 *         durationHours: { type: number, example: 1.5 }
 *         status: { type: string, enum: [scheduled, ongoing, completed, cancelled] }
 *         meetLink: { type: string, format: uri, example: "https://meet.jit.si/se-550e8400-e29b-41d4-a716-446655440000" }
 *         meetSpaceName: { type: string, nullable: true, example: null }
 */

/**
 * @swagger
 * /classrooms/{classroomId}/sessions:
 *   post:
 *     summary: Schedule a session in a classroom
 *     description: >
 *       Creates a Jitsi Meet session for the classroom. The tutor must own the classroom
 *       and it must be active. `scheduledAt` must be at least 30 minutes in the future.
 *       `durationHours` must be 0.5–4 in 0.5-hour steps. The new session must not overlap
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
classroomRouter.post(
  "/:classroomId/sessions",
  authMiddleware,
  requireActiveAccount,
  requireRole("tutor"),
  sessionController.createSession
);
