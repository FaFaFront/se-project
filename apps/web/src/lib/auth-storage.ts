import type { LoginResponse } from "@/types/auth";

const TOKEN_KEY = "tutorist.auth.token";
const USER_KEY = "tutorist.auth.user";

type AuthUser = LoginResponse["user"];

/**
 * Session lives in localStorage because the API returns the token in the
 * response body rather than an httpOnly cookie. Every access is guarded:
 * this module is imported by code that also runs during SSR, and browsers
 * in private mode can throw on access rather than returning null.
 */
function readItem(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveSession({ token, user }: LoginResponse): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Storage unavailable (private mode, quota). The token stays in memory
    // for this page load only — the user simply has to log in again later.
  }
}

export function getToken(): string | null {
  return readItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  const raw = readItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Nothing to clean up if storage is unavailable.
  }
}
