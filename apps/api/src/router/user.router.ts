import { Router } from "express";
import { userController } from "../controller/user.controller.js";
import { authMiddleware } from "../common/middleware/auth.middleware.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     StudentProfile:
 *       type: object
 *       additionalProperties: false
 *       required: [gradeLevel, goals]
 *       properties:
 *         gradeLevel:
 *           type: string
 *           example: "10th Grade"
 *         goals:
 *           type: string
 *           example: "Improve my math skills"
 *     TutorProfile:
 *       type: object
 *       additionalProperties: false
 *       required: [hourlyRate]
 *       properties:
 *         hourlyRate:
 *           type: number
 *           exclusiveMinimum: 0
 *           example: 25.0
 *     UserProfile:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, example: Student Name }
 *         email: { type: string, format: email }
 *         role: { type: string, enum: [student, tutor]}
 *         profileUrl: { type: string, format: uri }
 *         bio: { type: string, nullable: true }
 *         hourlyRate:
 *           type: number
 *           nullable: true
 *           description: Tutor only; null for students
 *           example: 25
 *         gradeLevel: { type: string, nullable: true, description: Student only }
 *         goals: { type: string, nullable: true, description: Student only }
 *         walletBalance: { type: number, example: 150.5 }
 *         createdAt: { type: string, format: date-time, example: "2026-01-15T08:30:00.000Z" }
 *         subjects:
 *           type: array
 *           description: Subjects the tutor teaches; empty array for students
 *           items:
 *             type: object
 *             properties:
 *               id: { type: string, format: uuid }
 *               name: { type: string, example: Mathematics }
 *     StudentProfileUpdate:
 *       type: object
 *       additionalProperties: false
 *       required: [name, profileUrl, bio, gradeLevel, goals]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: "Student Name"
 *         profileUrl:
 *           type: string
 *           format: uri
 *           example: "https://cdn.example.com/student.jpg"
 *         bio:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *           example: "I enjoy mathematics."
 *         gradeLevel:
 *           type: string
 *           minLength: 1
 *           example: "Grade 10"
 *         goals:
 *           type: string
 *           minLength: 1
 *           example: "Prepare for my final examination."
 *     TutorProfileUpdate:
 *       type: object
 *       additionalProperties: false
 *       required: [name, profileUrl, bio, hourlyRate]
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *           example: "Tutor Name"
 *         profileUrl:
 *           type: string
 *           format: uri
 *           example: "https://cdn.example.com/tutor.jpg"
 *         bio:
 *           type: string
 *           nullable: true
 *           maxLength: 1000
 *           example: "I have five years of teaching experience."
 *         hourlyRate:
 *           type: number
 *           exclusiveMinimum: 0
 *           example: 750.0
 */

// Cast router to use AuthRequest
const router = Router();
router.use((req, res, next) => {
  (req as unknown as AuthRequest).user = (req as unknown as AuthRequest).user;
  next();
});

/**
 * @swagger
 * /users/profile:
 *   post:
 *     summary: Complete user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/StudentProfile'
 *               - $ref: '#/components/schemas/TutorProfile'
 *     responses:
 *       200: { description: Profile completed successfully }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 */
router.post("/profile", authMiddleware, userController.submitProfile);

/**
 * @swagger
 * /users/me:
 *  get:
 *    summary: Get the authenticated user's profile
 *    tags: [User]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Profile retrieved successfully
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                success: { type: boolean, example: true }
 *                message: { type: string, example: Profile retrieved successfully. }
 *                data:
 *                  $ref: '#/components/schemas/UserProfile'
 *      401: { description: Unauthorized }
 *      404: { description: User not found }
 */
router.get("/me", authMiddleware, userController.getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Replace the authenticated user's editable profile
 *     description: Updates all editable profile fields for the authenticated role. Email, password, and role cannot be changed through this endpoint.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/StudentProfileUpdate'
 *               - $ref: '#/components/schemas/TutorProfileUpdate'
 *     responses:
 *       200: { description: Profile updated successfully }
 *       400: { description: Missing, invalid, role-incompatible, or unknown request fields }
 *       401: { description: Missing or invalid authentication, deleted user, or role mismatch }
 *       409: { description: Initial profile completion is required }
 *       500: { description: Internal server error }
 */
router.put("/profile", authMiddleware, userController.updateProfile);

export const userRouter = router;
