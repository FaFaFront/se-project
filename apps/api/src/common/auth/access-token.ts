import { Role } from "@prisma/client";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../errors/app-error.js";

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  role: z.nativeEnum(Role),
});

export type AuthIdentity = {
  id: string;
  role: Role;
};

export function verifyAccessToken(token: string): AuthIdentity {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const payload = accessTokenPayloadSchema.parse(decoded);
    return { id: payload.sub, role: payload.role };
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
