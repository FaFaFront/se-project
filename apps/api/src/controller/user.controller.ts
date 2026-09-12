import type { NextFunction, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import { userService } from "../service/user.service.js";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { Role } from "@prisma/client";
import { BadRequestError, UnauthorizedError } from "../common/errors/app-error.js";

const studentProfileFields = {
  gradeLevel: z.string().trim().min(1, "Grade level is required"),
  goals: z.string().trim().min(1, "Goals are required"),
} as const;

const tutorProfileFields = {
  hourlyRate: z
    .number()
    .finite("Hourly rate must be finite")
    .positive("Hourly rate must be positive"),
} as const;

const studentProfileSchema = z.object(studentProfileFields).strict();
const tutorProfileSchema = z.object(tutorProfileFields).strict();

const editableProfileFields = {
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  profileUrl: z.string().trim().url("Please enter a valid profile image URL").nullable(),
  bio: z.string().trim().max(1000, "Bio must be at most 1000 characters").nullable(),
} as const;

const studentProfileUpdateSchema = z
  .object({
    ...editableProfileFields,
    gradeLevel: studentProfileFields.gradeLevel.optional(),
    goals: studentProfileFields.goals.optional(),
  })
  .strict();
const tutorProfileUpdateSchema = z
  .object({
    ...editableProfileFields,
    hourlyRate: tutorProfileFields.hourlyRate.optional(),
    subjectIds: z
      .array(z.string().uuid("Each subject ID must be a valid UUID"))
      .refine((ids) => new Set(ids).size === ids.length, "Subject IDs must be unique")
      .optional(),
  })
  .strict();

type ProfileData = z.infer<typeof studentProfileSchema> | z.infer<typeof tutorProfileSchema>;
type ProfileUpdateRequest =
  | { role: typeof Role.student; data: z.infer<typeof studentProfileUpdateSchema> }
  | { role: typeof Role.tutor; data: z.infer<typeof tutorProfileUpdateSchema> };

export const userController = {
  async submitProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("User not found in request");
      }

      const role = user.role as Role;
      let validatedData: ProfileData;

      if (role === "student") {
        validatedData = studentProfileSchema.parse(req.body);
      } else if (role === "tutor") {
        validatedData = tutorProfileSchema.parse(req.body);
      } else {
        throw new BadRequestError("Invalid role");
      }

      const updatedUser = await userService.completeProfile(user.id, role, validatedData);
      res.status(200).json(successResponse(updatedUser, "Profile completed successfully"));
    } catch (error) {
      next(error);
    }
  },

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("User not found in request");
      }

      const profile = await userService.getProfile(user.id);
      res
        .set("Cache-Control", "no-store")
        .status(200)
        .json(successResponse(profile, "Profile retrieved successfully."));
    } catch (error) {
      next(error);
    }
  },

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedError("User not found in request");
      }

      let profileUpdate: ProfileUpdateRequest;

      if (user.role === Role.student) {
        profileUpdate = {
          role: Role.student,
          data: studentProfileUpdateSchema.parse(req.body),
        };
      } else if (user.role === Role.tutor) {
        profileUpdate = {
          role: Role.tutor,
          data: tutorProfileUpdateSchema.parse(req.body),
        };
      } else {
        throw new UnauthorizedError("Invalid authentication role");
      }

      const updatedUser = await userService.updateProfile(user.id, profileUpdate);
      res.status(200).json(successResponse(updatedUser, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  },
};
