import type { NextFunction, Response } from "express";
import { z } from "zod";
import type { AuthRequest } from "../common/middleware/auth.middleware.js";
import { UnauthorizedError } from "../common/errors/app-error.js";
import { successResponse } from "../common/utils/response.js";
import { TOP_UP_AMOUNTS, walletService } from "../service/wallet.service.js";

const topUpSchema = z
  .object({
    amount: z.number().refine((amount) => TOP_UP_AMOUNTS.some((preset) => preset === amount), {
      message: "Please select a preset amount: 100, 300, 500, or 1000",
    }),
  })
  .strict();

export const walletController = {
  async getWallet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const wallet = await walletService.getWallet(req.user.id);
      res.set("Cache-Control", "no-store");
      res.json(successResponse(wallet, "Wallet retrieved"));
    } catch (error) {
      next(error);
    }
  },

  async topUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { amount } = topUpSchema.parse(req.body);
      const wallet = await walletService.topUp(req.user.id, amount);
      res.json(successResponse(wallet, "Mock top-up successful"));
    } catch (error) {
      next(error);
    }
  },
};
