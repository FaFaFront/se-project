import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { sessionService } from "../service/session.service.js";

const classroomSessionParamsSchema = z.object({
  classroomId: z.string().uuid("Classroom ID must be a valid UUID"),
});

const sessionParamsSchema = z.object({
  sessionId: z.string().uuid("Session ID must be a valid UUID"),
});

const createSessionSchema = z
  .object({
    scheduledAt: z.string().datetime("scheduledAt must be a valid ISO 8601 datetime"),
    durationHours: z
      .number({ message: "durationHours must be a number" })
      .min(0.5, "Duration must be at least 0.5 hours")
      .max(4, "Duration must be at most 4 hours"),
  })
  .strict();

export const sessionController = {
  async createSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { classroomId } = classroomSessionParamsSchema.parse(req.params);
      const input = createSessionSchema.parse(req.body);
      const session = await sessionService.createSession(classroomId, req.user.id, input);
      res.status(201).json(successResponse(session, "Session scheduled successfully"));
    } catch (error) {
      next(error);
    }
  },

  async cancelSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { sessionId } = sessionParamsSchema.parse(req.params);
      const session = await sessionService.cancelSession(sessionId, req.user.id);
      res.status(200).json(successResponse(session, "Session cancelled successfully"));
    } catch (error) {
      next(error);
    }
  },
};
