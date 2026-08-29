import { Router } from "express";
import { authController } from "../controller/auth.controller.js";

export const authRouter = Router();

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
 *               password: { type: string, format: password }
 *     responses:
 *       200: { description: Login successful }
 *       400: { description: Invalid request body }
 *       401: { description: Invalid email or password }
 */
authRouter.post("/login", authController.login);
