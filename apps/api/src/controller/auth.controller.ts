import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import { authService } from "../service/auth.service.js";

const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role, { message: 'Role must be either "student" or "tutor"' }),
  profileUrl: z.string().trim().url("Please enter a valid profile image URL"),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, profileUrl } = registerSchema.parse(req.body);
      const registration = await authService.register(name, email, password, role, profileUrl);
      res.status(201).json(successResponse(registration, "Registration successful"));
    } catch (error) {
      next(error);
    }
  },
};
