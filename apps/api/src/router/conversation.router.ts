import { Router } from "express";
import { authMiddleware, requireActiveAccount } from "../common/middleware/auth.middleware.js";
import { conversationController } from "../controller/conversation.controller.js";

const router = Router();
router.use(authMiddleware, requireActiveAccount);

/**
 * @openapi
 * /conversations/{conversationId}/messages:
 *   get:
 *     summary: Get all messages in a conversation
 *     description: Returns messages in chronological order. The signed-in user must be a participant.
 *     tags: [Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Message history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Message history retrieved }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ChatMessage'
 *       400: { description: Invalid conversation ID }
 *       401: { description: Unauthorized }
 *       403: { description: The user is not a participant or the account is inactive }
 */
router.get("/:conversationId/messages", conversationController.getMessageHistory);

export const conversationRouter = router;
