import type { ExtendedError } from "socket.io";
import type { SocketAckFailure } from "../socket.types.js";

export type SocketConnectionErrorCode =
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_INVALID"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_INACTIVE"
  | "INTERNAL_ERROR";

export function createSocketConnectionError(
  code: SocketConnectionErrorCode,
  message: string
): ExtendedError {
  const error = new Error(message) as ExtendedError;
  error.data = { code };
  return error;
}

export function createSocketAckFailure<Code extends string>(
  code: Code,
  message: string
): SocketAckFailure<Code> {
  return { success: false, code, message };
}
