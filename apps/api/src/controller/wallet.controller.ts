import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { ForbiddenError, UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { TOP_UP_AMOUNTS, walletService } from "../service/wallet.service.js";

const topUpSchema = z
  .object({
    amount: z.number().refine((amount) => TOP_UP_AMOUNTS.some((preset) => preset === amount), {
      message: "Please select a preset amount: 100, 300, 500, or 1000",
    }),
  })
  .strict();

function studentId(req: AuthRequest) {
  if (!req.user) throw new UnauthorizedError();
  if (req.user.role !== "student") throw new ForbiddenError("Only students can access top-ups");
  return req.user.id;
}

export const walletController = {
  async getWallet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const wallet = await walletService.getWallet(studentId(req));
      res.set("Cache-Control", "no-store");
      res.json(successResponse(wallet, "Wallet retrieved"));
    } catch (error) {
      next(error);
    }
  },

  async topUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = studentId(req);
      const { amount } = topUpSchema.parse(req.body);
      const wallet = await walletService.topUp(userId, amount);
      res.json(successResponse(wallet, "Mock top-up successful"));
    } catch (error) {
      next(error);
    }
  },
};
