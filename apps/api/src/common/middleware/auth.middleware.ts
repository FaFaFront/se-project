import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AccountStatus } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error.js";
import { env } from "../../config/env.js";
import { authRepository } from "../../repository/auth.repository.js";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication token is missing");
    }

    const token = authHeader.split(" ")[1];
    let decoded: { sub: string; role: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
    } catch {
      throw new UnauthorizedError("Invalid or expired token");
    }

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Blocks inactive accounts from protected features. Applied after
 * `authMiddleware`. Intentionally omitted from GET /users/me and
 * PATCH /users/me/status so a paused account can still read and restore status.
 */
export const requireActiveAccount = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError("User not found in request");
    }

    const account = await authRepository.findAccountStatusById(req.user.id);
    if (!account) {
      throw new UnauthorizedError("Authenticated user no longer exists");
    }
    if (account.accountStatus === AccountStatus.INACTIVE) {
      throw new ForbiddenError("This account is inactive");
    }

    next();
  } catch (error) {
    next(error);
  }
};
