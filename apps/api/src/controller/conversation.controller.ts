import type { NextFunction, Response } from "express";
import { successResponse } from "../common/utils/response.js";
import { conversationService } from "../service/conversation.service.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";

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
};
