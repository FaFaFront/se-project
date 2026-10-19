import { AccountStatus } from "@prisma/client";
import type { ExtendedError } from "socket.io";
import { UnauthorizedError } from "../../common/errors/app-error.js";
import { verifyAccessToken, type AuthIdentity } from "../../common/auth/access-token.js";
import { authRepository } from "../../repository/auth.repository.js";
import type { AppSocket } from "../socket.types.js";
import { createSocketConnectionError } from "../utils/socket-error.js";

export function socketAuthMiddleware(socket: AppSocket, next: (error?: ExtendedError) => void) {
  void authenticateSocket(socket)
    .then(() => next())
    .catch((error: unknown) => {
      const failure = getSafeConnectionFailure(error);
      if (failure) {
        next(createSocketConnectionError(failure.code, failure.message));
        return;
      }

      console.error("Socket authentication failed");
      next(createSocketConnectionError("INTERNAL_ERROR", "Unable to authenticate connection"));
    });
}

async function authenticateSocket(socket: AppSocket): Promise<void> {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || token.trim() === "") {
    throw createSocketConnectionError("AUTH_TOKEN_MISSING", "Authentication token is missing");
  }

  let identity: AuthIdentity;
  try {
    identity = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw createSocketConnectionError("AUTH_TOKEN_INVALID", "Invalid or expired token");
    }
    throw error;
  }

  try {
    const account = await authRepository.findAccountStatusById(identity.id);
    if (!account) {
      throw createSocketConnectionError("ACCOUNT_NOT_FOUND", "Authenticated user no longer exists");
    }
    if (account.accountStatus === AccountStatus.INACTIVE) {
      throw createSocketConnectionError("ACCOUNT_INACTIVE", "This account is inactive");
    }

    socket.data.user = { id: identity.id, role: identity.role };
  } catch (error) {
    if (error instanceof Error && "data" in error) {
      throw error;
    }
    console.error("Socket account authentication failed");
    throw createSocketConnectionError("INTERNAL_ERROR", "Unable to authenticate connection");
  }
}

function getSafeConnectionFailure(
  error: unknown
): { code: Parameters<typeof createSocketConnectionError>[0]; message: string } | null {
  if (!(error instanceof Error) || !("data" in error)) {
    return null;
  }

  const data = error.data;
  if (!data || typeof data !== "object" || !("code" in data)) {
    return null;
  }

  switch (data.code) {
    case "AUTH_TOKEN_MISSING":
      return { code: data.code, message: "Authentication token is missing" };
    case "AUTH_TOKEN_INVALID":
      return { code: data.code, message: "Invalid or expired token" };
    case "ACCOUNT_NOT_FOUND":
      return { code: data.code, message: "Authenticated user no longer exists" };
    case "ACCOUNT_INACTIVE":
      return { code: data.code, message: "This account is inactive" };
    case "INTERNAL_ERROR":
      return { code: data.code, message: "Unable to authenticate connection" };
    default:
      return null;
  }
}
