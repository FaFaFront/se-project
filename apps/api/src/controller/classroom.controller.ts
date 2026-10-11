import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { classroomService } from "../service/classroom.service.js";

const classroomParamsSchema = z.object({
  classroomId: z.string().uuid("Classroom ID must be a valid UUID"),
});

export const classroomController = {
  async getClassroomDetail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not found in request");
      }

      const { classroomId } = classroomParamsSchema.parse(req.params);
      const classroom = await classroomService.getClassroomDetail(classroomId, req.user.id);

      res
        .set("Cache-Control", "no-store")
        .status(200)
        .json(successResponse(classroom, "Classroom retrieved successfully"));
    } catch (error) {
      next(error);
    }
  },
};
