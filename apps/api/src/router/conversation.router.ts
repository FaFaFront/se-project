import { Router } from "express";
import { conversationController } from "../controller/conversation.controller.js";
import { authMiddleware } from "../common/middleware/auth.middleware.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     ConversationSummary:
 *       type: object
 *       properties:
 *         id: { type: string, format: uuid }
 *         otherParticipant:
 *           type: object
 *           properties:
 *             id: { type: string, format: uuid }
 *             name: { type: string, nullable: true, example: "Jane Doe" }
 *             profileUrl: { type: string, nullable: true, format: uri }
 *         lastMessage:
 *           nullable: true
 *           type: object
 *           properties:
 *             text: { type: string, example: "Hello!" }
 *             createdAt: { type: string, format: date-time }
 *             senderId: { type: string, format: uuid }
 *         createdAt: { type: string, format: date-time }
 */

const router = Router();

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: List all conversations for the authenticated user
 *     description: Ordered by most recent message. Conversations with no messages appear last.
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Conversations retrieved successfully" }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ConversationSummary'
 *       401: { description: Unauthorized }
 */
router.get("/", authMiddleware, conversationController.listConversations);

export const conversationRouter = router;
