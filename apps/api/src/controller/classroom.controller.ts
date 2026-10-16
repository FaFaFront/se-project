import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { classroomService } from "../service/classroom.service.js";

const createClassroomSchema = z
  .object({
    conversationId: z.string().uuid("Conversation ID must be a valid UUID"),
    subjectId: z.string().uuid("Subject ID must be a valid UUID"),
    pricePerHour: z.number().positive("Price per hour must be a positive number").optional(),
  })
  .strict();

export const classroomController = {
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
};
