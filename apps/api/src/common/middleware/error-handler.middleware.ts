import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { errorResponse } from "../utils/response.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json(errorResponse(err.issues.map((i) => i.message).join(", ")));
    return;
  }

  console.error(err);
  res.status(500).json(errorResponse("Internal server error"));
}
