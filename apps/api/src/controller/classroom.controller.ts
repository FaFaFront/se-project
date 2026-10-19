import { ClassroomStatus, Role } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { classroomService } from "../service/classroom.service.js";

const classroomParamsSchema = z.object({
  classroomId: z.string().uuid("Classroom ID must be a valid UUID"),
});

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
    .transform((value) => (value === "all" || value === "" ? undefined : value)),
});

const createClassroomSchema = z
  .object({
    conversationId: z.string().uuid("Conversation ID must be a valid UUID"),
    subjectId: z.string().uuid("Subject ID must be a valid UUID"),
    pricePerHour: z.number().positive("Price per hour must be a positive number").optional(),
  })
  .strict();

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

  async createClassroom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const input = createClassroomSchema.parse(req.body);
      const classroom = await classroomService.createClassroom(req.user.id, input);
      res.status(201).json(successResponse(classroom, "Classroom created"));
    } catch (error) {
      next(error);
    }
  },

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
