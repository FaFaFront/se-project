import type { NextFunction, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import { userService } from "../service/user.service.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { Role } from "@prisma/client";

const studentProfileSchema = z.object({
  gradeLevel: z.string().trim().min(1, "Grade level is required"),
  goals: z.string().trim().min(1, "Goals are required"),
});

const tutorProfileSchema = z.object({
  hourlyRate: z.number().positive("Hourly rate must be positive"),
});

export const userController = {
  async submitProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new Error("User not found in request");
      }

      const role = user.role as Role;
      let validatedData: any;

      if (role === "student") {
        validatedData = studentProfileSchema.parse(req.body);
      } else if (role === "tutor") {
        validatedData = tutorProfileSchema.parse(req.body);
      }

      const updatedUser = await userService.completeProfile(user.id, role, validatedData);
      res.status(200).json(successResponse(updatedUser, "Profile completed successfully"));
    } catch (error) {
      next(error);
    }
  },
};
