import { ClassroomStatus, Role } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { classroomService } from "../service/classroom.service.js";

const classroomParamsSchema = z
  .object({ classroomId: z.string().uuid("Classroom ID must be a valid UUID") })
  .strict();

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

// Shared by create and update so both reject values Decimal(10, 2) can't store.
const pricePerHourSchema = z
  .number({ message: "Price per hour must be a number" })
  .positive("Price per hour must be a positive number")
  .max(99_999_999.99, "Price per hour is too large")
  .refine(
    (value) => Number.isInteger(Number((value * 100).toFixed(6))),
    "Price per hour can have at most 2 decimal places"
  );

const createClassroomSchema = z
  .object({
    conversationId: z.string().uuid("Conversation ID must be a valid UUID"),
    subjectId: z.string().uuid("Subject ID must be a valid UUID"),
    pricePerHour: pricePerHourSchema.optional(),
  })
  .strict();

const updateClassroomSchema = z
  .object({
    subjectId: z.string().uuid("Subject ID must be a valid UUID"),
    pricePerHour: pricePerHourSchema,
  })
  // Unknown keys (id, tutorId, studentId, status, createdAt, ...) are rejected, not ignored.
  .strict();

const deactivateBodySchema = z.object({}).strict().optional();

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

  async updateClassroom(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError("User not found in request");
      }

      const { classroomId } = classroomParamsSchema.parse(req.params);
      const input = updateClassroomSchema.parse(req.body);
      const classroom = await classroomService.updateClassroom(classroomId, req.user.id, input);

      res.status(200).json(successResponse(classroom, "Classroom updated successfully"));
    } catch (error) {
      next(error);
    }
  },

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
