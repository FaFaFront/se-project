import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { BadRequestError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { sessionService } from "../service/session.service.js";

const classroomParamsSchema = z
  .object({ classroomId: z.string().uuid("Classroom ID must be a valid UUID") })
  .strict();

const sessionParamsSchema = z
  .object({ sessionId: z.string().uuid("Session ID must be a valid UUID") })
  .strict();

const joinBodySchema = z.object({}).strict().optional();

export const sessionController = {
  async listClassroomSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not found in request");
      }

      const { classroomId } = classroomParamsSchema.parse(req.params);
      const sessions = await sessionService.listClassroomSessions(classroomId, req.user.id);

      res
        .set("Cache-Control", "no-store")
        .status(200)
        .json(successResponse(sessions, "Sessions retrieved successfully"));
    } catch (error) {
      next(error);
    }
  },

  async joinSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not found in request");
      }

      const { sessionId } = sessionParamsSchema.parse(req.params);
      const hasBody =
        Number(req.headers["content-length"] ?? 0) > 0 ||
        req.headers["transfer-encoding"] !== undefined;
      if (hasBody && !req.is("application/json")) {
        throw new BadRequestError("Omit the request body or send an empty JSON object");
      }
      joinBodySchema.parse(req.body);

      const result = await sessionService.joinSession(sessionId, req.user.id);

      // The Meet link is a credential for the room; don't let it sit in any cache.
      res
        .set("Cache-Control", "no-store")
        .status(200)
        .json(successResponse(result, "Session joined successfully"));
    } catch (error) {
      next(error);
    }
  },
};
