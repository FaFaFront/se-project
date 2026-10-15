import { Router } from "express";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";
import { conversationController } from "../controller/conversation.controller.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     ConversationMessageSender:
 *       type: object
 *       additionalProperties: false
 *       required: [id, name, role, profileUrl]
 *       properties:
 *         id: { type: string, format: uuid }
 *         name: { type: string, nullable: true, example: Student Name }
 *         role: { type: string, enum: [student, tutor] }
 *         profileUrl: { type: string, format: uri, nullable: true }
 *     ConversationMessage:
 *       type: object
 *       additionalProperties: false
 *       required: [id, conversationId, senderId, text, createdAt, sender]
 *       properties:
 *         id: { type: string, format: uuid }
 *         conversationId: { type: string, format: uuid }
 *         senderId: { type: string, format: uuid }
 *         text: { type: string, example: "Hello, are you available tomorrow?" }
 *         createdAt: { type: string, format: date-time, example: "2026-10-14T08:30:00.000Z" }
 *         sender:
 *           $ref: '#/components/schemas/ConversationMessageSender'
 *     MessageHistory:
 *       type: object
 *       additionalProperties: false
 *       required: [conversationId, participant, messages]
 *       properties:
 *         conversationId: { type: string, format: uuid }
 *         participant:
 *           $ref: '#/components/schemas/ConversationMessageSender'
 *         messages:
 *           type: array
 *           description: Complete message history, ordered oldest to newest by creation time and then ID.
 *           items:
 *             $ref: '#/components/schemas/ConversationMessage'
 */

const router = Router();

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   get:
 *     summary: Get the complete message history for a conversation
 *     description: Only a conversation participant can fetch its messages. Messages are ordered oldest to newest by createdAt, then id.
 *     tags: [Conversation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         description: UUID of the conversation
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Message history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [success, message, data]
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Message history retrieved successfully }
 *                 data:
 *                   $ref: '#/components/schemas/MessageHistory'
 *       400: { description: Conversation ID must be a valid UUID }
 *       401: { description: Missing or invalid JWT, or the authenticated account was deleted }
 *       403: { description: The authenticated account is inactive }
 *       404: { description: Conversation not found or the authenticated user is not a participant }
 */
router.get(
  "/:conversationId/messages",
  authMiddleware,
  requireActiveAccount,
  conversationController.getMessageHistory
);

export const conversationRouter = router;
