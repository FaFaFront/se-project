"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken } from "@/lib/auth-storage";
import type { UserProfile } from "@/types/user";

type AuthContextValue = {
  /** null while signed out; stays populated during a background revalidation. */
  profile: UserProfile | null;
  /** True only until the first check resolves — not on every revalidation. */
  isLoading: boolean;
  /** Set when a revalidation fails for a reason other than an expired session. */
  error: string | null;
  /** Re-fetches `/users/me`. Call after an action that can change role/profile state. */
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Single source of truth for the signed-in user's profile, shared by the
 * Navbar, route guard, and profile page — previously each fetched
 * `/users/me` (or read localStorage) independently and could disagree.
 * Mounted once at the root; revalidates on navigation and on the `storage`
 * event, which callers dispatch manually to signal a same-tab session change
 * localStorage's own `storage` event doesn't fire for (see
 * profile-completion-form.tsx).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const data = await apiClient.get<UserProfile>("/users/me");
      setProfile(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        setProfile(null);
      } else {
        // Transient failure: keep whatever profile we already had rather
        // than signing the user out over a flaky connection.
        setError(
          err instanceof Error && err.message ? err.message : "Unable to verify your session."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  useEffect(() => {
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } finally {
      clearSession();
      setProfile(null);
      router.replace("/login");
    }
  }, [router]);

  const value = useMemo(
    () => ({ profile, isLoading, error, refresh: load, logout }),
    [profile, isLoading, error, load, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
