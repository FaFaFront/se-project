import { Prisma, TransactionType } from "@prisma/client";
import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { TOP_UP_AMOUNTS, transactionService } from "../service/transaction.service.js";
import { THAI_BANK_CODES } from "../common/utils/withdrawal-metadata.js";

const requestIdSchema = z
  .string()
  .uuid("Request ID must be a UUID")
  .transform((id) => id.toLowerCase());

const historySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1_000_000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.nativeEnum(TransactionType).optional(),
  })
  .strict();

const topUpSchema = z
  .object({
    requestId: requestIdSchema,
    amount: z.number().refine((amount) => TOP_UP_AMOUNTS.some((preset) => preset === amount), {
      message: "Please select a preset amount: 100, 300, 500, or 1000",
    }),
  })
  .strict();

const withdrawalSchema = z
  .object({
    requestId: requestIdSchema,
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

function userId(req: AuthRequest, role?: "tutor" | "student") {
  if (!req.user) throw new UnauthorizedError();
  if (role && req.user.role !== role)
    throw new ForbiddenError(`Only ${role}s can access this operation`);
  return req.user.id;
}

export const transactionController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = userId(req);
      const input = historySchema.parse(req.query);
      const data = await transactionService.list(id, input);
      res.set("Cache-Control", "no-store").json(successResponse(data, "Transactions retrieved"));
    } catch (error) {
      next(error);
    }
  },

  async getTopUpOptions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await transactionService.getTopUpOptions(userId(req, "student"));
      res.set("Cache-Control", "no-store").json(successResponse(data, "Top-up options retrieved"));
    } catch (error) {
      next(error);
    }
  },

  async topUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = userId(req, "student");
      const input = topUpSchema.parse(req.body);
      const result = await transactionService.submitTopUp(id, input);
      res
        .set("Cache-Control", "no-store")
        .status(result.replayed ? 200 : 201)
        .json(successResponse(result.data, "Mock top-up completed"));
    } catch (error) {
      next(error);
    }
  },

  async getWithdrawalByRequest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = userId(req, "tutor");
      const requestId = requestIdSchema.parse(req.params.requestId);
      const withdrawal = await transactionService.getWithdrawalByRequest(id, requestId);
      res
        .set("Cache-Control", "no-store")
        .json(successResponse(withdrawal, "Withdrawal retrieved"));
    } catch (error) {
      next(error);
    }
  },
  async withdraw(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = userId(req, "tutor");
      const input = withdrawalSchema.parse(req.body);
      const result = await transactionService.submitWithdrawal(id, input);
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
      const ownerId = userId(req);
      const id = z.string().uuid("Transaction ID must be a UUID").parse(req.params.id);
      const transaction = await transactionService.get(ownerId, id);
      res
        .set("Cache-Control", "no-store")
        .json(successResponse(transaction, "Transaction retrieved"));
    } catch (error) {
      next(error);
    }
  },
};
