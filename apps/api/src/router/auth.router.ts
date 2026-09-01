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
 *       201: { description: Registration successful }
 *       400: { description: Invalid registration details }
 *       409: { description: Email already registered }
 */
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
