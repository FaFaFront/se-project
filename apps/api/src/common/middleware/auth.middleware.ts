import type { NextFunction, Request, Response } from "express";
import { AccountStatus } from "@prisma/client";
import { ForbiddenError, UnauthorizedError } from "../errors/app-error.js";
import { authRepository } from "../../repository/auth.repository.js";
import { verifyAccessToken } from "../auth/access-token.js";

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

    const token = authHeader.slice("Bearer ".length);
    req.user = verifyAccessToken(token);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts a route to specific roles. Applied after `authMiddleware`.
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError("User not found in request");
      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(`Only ${roles.join(" or ")} can access this resource`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
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
