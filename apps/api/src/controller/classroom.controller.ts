import type { NextFunction, Response } from "express";
import { z } from "zod";
import { BadRequestError, UnauthorizedError } from "../common/errors/app-error.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { successResponse } from "../common/utils/response.js";
import { classroomService } from "../service/classroom.service.js";

const classroomParamsSchema = z
  .object({ classroomId: z.string().uuid("Classroom ID must be a valid UUID") })
  .strict();
const deactivateBodySchema = z.object({}).strict().optional();

export const classroomController = {
  async deactivate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not found in request");
      }
      const { classroomId } = classroomParamsSchema.parse(req.params);
      const hasBody =
        Number(req.headers["content-length"] ?? 0) > 0 ||
        req.headers["transfer-encoding"] !== undefined;
      if (hasBody && !req.is("application/json")) {
        throw new BadRequestError("Omit the request body or send an empty JSON object");
      }
      deactivateBodySchema.parse(req.body);
      const result = await classroomService.deactivate(classroomId, req.user.id, req.user.role);
      res.status(200).json(successResponse(result, "Classroom deactivated successfully."));
    } catch (error) {
      next(error);
    }
  },
};
