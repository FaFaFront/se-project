import { Router } from "express";
import { userController } from "../controller/user.controller.js";
import { authMiddleware } from "../common/middleware/auth.middleware.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";

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
