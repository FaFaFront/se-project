import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { successResponse } from "../common/utils/response.js";
import { authService } from "../service/auth.service.js";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const authController = {
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
