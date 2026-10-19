import type { NextFunction, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { conversationService } from "../service/conversation.service.js";

const conversationParamsSchema = z
  .object({
    conversationId: z.string().uuid("Conversation ID must be a valid UUID"),
  })
  .strict();

export const conversationController = {
  async listConversations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError("User not found in request");
      const conversations = await conversationService.listForUser(req.user.id);
      res.status(200).json(successResponse(conversations, "Conversations retrieved successfully"));
    } catch (error) {
      next(error);
    }
  },

  async getMessageHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("User not found in request");
      }

      const { conversationId } = conversationParamsSchema.parse(req.params);
      const history = await conversationService.getMessageHistory(conversationId, user.id);

      res
        .set("Cache-Control", "no-store")
        .status(200)
        .json(successResponse(history, "Message history retrieved successfully"));
    } catch (error) {
      next(error);
    }
  },
};
