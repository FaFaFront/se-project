import type { NextFunction, Response } from "express";
import { z } from "zod";
import { UnauthorizedError } from "../common/errors/app-error.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { successResponse } from "../common/utils/response.js";
import { conversationService } from "../service/conversation.service.js";

const conversationParamsSchema = z.object({
  conversationId: z.string().uuid("Conversation ID must be a valid UUID"),
});

export const conversationController = {
  async getMessageHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();

      const { conversationId } = conversationParamsSchema.parse(req.params);
      const messages = await conversationService.getMessageHistory(conversationId, req.user.id);

      res.set("Cache-Control", "no-store");
      res.status(200).json(successResponse(messages, "Message history retrieved"));
    } catch (error) {
      next(error);
    }
  },
};
