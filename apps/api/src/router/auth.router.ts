import { Router } from "express";
import { authController } from "../controller/auth.controller.js";

export const authRouter = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a student or tutor
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, role]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, format: password }
 *               role: { type: string, enum: [student, tutor] }
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Registration successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, description: JWT valid for 7 days }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string, format: uuid }
 *                         name: { type: string, nullable: true }
 *                         email: { type: string, format: email }
 *                         role: { type: string, enum: [student, tutor] }
 *                         profileUrl: { type: string, format: uri, nullable: true }
 *       400: { description: Invalid registration details }
 *       409: { description: Email already registered }
 */
authRouter.post("/register", authController.register);
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 1, format: password }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Login successful }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, description: JWT valid for 7 days }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string, nullable: true }
 *                         email: { type: string, format: email }
 *                         role: { type: string, enum: [student, tutor] }
 *                         profileUrl: { type: string, format: uri, nullable: true }
 *       400: { description: Validation error }
 *       401: { description: Invalid email or password }
 */
authRouter.post("/login", authController.login);
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     description: >
 *       Stateless logout. The JWT is not stored server-side, so the client ends
 *       the session by discarding its token. This endpoint always succeeds — even
 *       without an active session — and is safe to call repeatedly.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Logout successful }
 *                 data: { type: object, nullable: true, example: null }
 */
authRouter.post("/logout", authController.logout);
