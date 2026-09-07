import { Role } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import { authService } from "../service/auth.service.js";

const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(Role, { message: 'Role must be either "student" or "tutor"' }),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, role } = registerSchema.parse(req.body);
      const registration = await authService.register(email, password, role);
      res.status(201).json(successResponse(registration, "Registration successful"));
    } catch (error) {
      next(error);
    }
  },
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await authService.login(email, password);
      res.status(200).json(successResponse(result, "Login successful"));
    } catch (error) {
      next(error);
    }
  },
};
