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
 *       required: [hourlyRate]
 *       properties:
 *         hourlyRate:
 *           type: number
 *           example: 25.0
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

export const userRouter = router;
