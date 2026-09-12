import { Prisma } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { withdrawalService } from "../service/withdrawal.service.js";
import { THAI_BANK_CODES } from "../common/utils/withdrawal-metadata.js";

export const withdrawalSchema = z
  .object({
    requestId: z
      .string()
      .uuid("Request ID must be a UUID")
      .transform((id) => id.toLowerCase()),
    amount: z
      .number()
      .finite()
      .positive("Withdrawal amount must be greater than zero")
      .max(9999999999.99, "Withdrawal amount exceeds the supported precision")
      .refine(
        (amount) => new Prisma.Decimal(amount).decimalPlaces() <= 2,
        "Withdrawal amount must have at most two decimal places"
      ),
    password: z.string().min(1, "Confirmation password is required"),
    bankCode: z.enum(THAI_BANK_CODES, { message: "Please select a supported Thai bank" }),
    accountNumber: z
      .string()
      .max(64)
      .trim()
      .transform((value) => value.replace(/[ -]/g, ""))
      .pipe(z.string().regex(/^\d{6,20}$/, "Bank account number must contain 6 to 20 digits")),
    accountHolderName: z
      .string()
      .trim()
      .min(1, "Account holder name is required")
      .max(100)
      .transform((name) => name.replace(/\s+/g, " ")),
  })
  .strict();

function tutorId(req: AuthRequest) {
  if (!req.user) throw new UnauthorizedError();
  if (req.user.role !== "tutor") throw new ForbiddenError("Only tutors can withdraw balance");
  return req.user.id;
}

export const withdrawalController = {
  async submit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = tutorId(req);
      const input = withdrawalSchema.parse(req.body);
      const result = await withdrawalService.submit(userId, input);
      res
        .set("Cache-Control", "no-store")
        .status(result.replayed ? 200 : 201)
        .json(successResponse(result.data, "Mock withdrawal completed"));
    } catch (error) {
      next(error);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = tutorId(req);
      const id = z.string().uuid("Withdrawal ID must be a UUID").parse(req.params.id);
      const withdrawal = await withdrawalService.get(userId, id);
      res
        .set("Cache-Control", "no-store")
        .json(successResponse(withdrawal, "Withdrawal retrieved"));
    } catch (error) {
      next(error);
    }
  },
};
