import type { NextFunction, Response } from "express";
import { ClassroomStatus, Role } from "@prisma/client";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { classroomService } from "../service/classroom.service.js";

const classroomListQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search term is too long")
    .optional()
    .transform((value) => value || undefined),
  subjectId: z
    .string()
    .uuid("Subject ID must be a valid UUID")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  status: z
    .enum([ClassroomStatus.active, ClassroomStatus.completed, "all", ""], {
      message: 'Status must be one of "active", "completed", or "all"',
    })
    .optional()
    // "all" and an empty value both mean "don't filter by status".
    .transform((value) => (value === "all" || value === "" ? undefined : value)),
});

/** The tutor ID always comes from the verified token, never from the request. */
function tutorId(req: AuthRequest) {
  if (!req.user) throw new UnauthorizedError("User not found in request");
  if (req.user.role !== Role.tutor) {
    throw new ForbiddenError("Only tutors can view their classroom list");
  }
  return req.user.id;
}

export const classroomController = {
  async listTutorClassrooms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = tutorId(req);
      const filter = classroomListQuerySchema.parse(req.query);
      const classrooms = await classroomService.listTutorClassrooms(id, filter);

      res
        .set("Cache-Control", "no-store")
        .status(200)
        .json(successResponse(classrooms, "Classrooms retrieved successfully."));
    } catch (error) {
      next(error);
    }
  },
};
