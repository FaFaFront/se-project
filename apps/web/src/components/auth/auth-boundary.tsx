"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken } from "@/lib/auth-storage";
import type { UserRole } from "@/types/auth";
import type { UserProfile } from "@/types/user";

type GuestRule = { prefix: string; guest: true };

type ProtectedRule = {
  prefix: string;
  guest?: false;
  /** Roles allowed to view this route. Omit to allow any signed-in role. */
  allowRoles?: UserRole[];
  /** False on complete-profile, which must stay reachable while incomplete. Default true. */
  requireProfileComplete?: boolean;
  /** True on complete-profile, so a finished profile bounces away instead of re-showing the form. */
  redirectIfProfileComplete?: boolean;
};

type RouteRule = GuestRule | ProtectedRule;

/**
 * Every route that needs a signed-in (or signed-out) gate, keyed by path
 * prefix. Add a new protected/guest page here instead of a new layout.tsx —
 * one boundary, one `/users/me` fetch per navigation, no per-route wiring.
 */
const ROUTE_RULES: RouteRule[] = [
  { prefix: "/login", guest: true },
  { prefix: "/register", guest: true },
  { prefix: "/complete-profile", requireProfileComplete: false, redirectIfProfileComplete: true },
  { prefix: "/balance", allowRoles: ["student"] },
  { prefix: "/profile" },
  { prefix: "/classroom" },
  { prefix: "/message" },
];

function matchRule(pathname: string): RouteRule | undefined {
  const matches = ROUTE_RULES.filter(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
  );
  return matches.sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

/**
 * Single client-side gate mounted once in the root layout. Matches the
 * current path against `ROUTE_RULES` and, for a match, fetches `/users/me`
 * (role/completion can't be trusted from localStorage alone) before
 * rendering children, so protected content never flashes on screen.
 * Unmatched paths (home, tutors, ...) render immediately with no fetch.
 */
export function AuthBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowedPath, setAllowedPath] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const rule = matchRule(pathname);

    async function run() {
      if (!rule) {
        setAllowedPath(pathname);
        return;
      }

      const token = getToken();

      if (rule.guest) {
        if (!token) {
          setAllowedPath(pathname);
          return;
        }
        try {
          const profile = await apiClient.get<UserProfile>("/users/me");
          if (!active) return;
          router.replace(profile.profileComplete ? "/" : `/complete-profile?role=${profile.role}`);
        } catch (error) {
          if (!active) return;
          if (error instanceof ApiError && error.status === 401) clearSession();
          setAllowedPath(pathname);
        }
        return;
      }

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await apiClient.get<UserProfile>("/users/me");
        if (!active) return;

        const requireProfileComplete = rule.requireProfileComplete ?? true;
        if (requireProfileComplete && !profile.profileComplete) {
          router.replace(`/complete-profile?role=${profile.role}`);
          return;
        }
        if (rule.redirectIfProfileComplete && profile.profileComplete) {
          router.replace("/");
          return;
        }
        if (rule.allowRoles && !rule.allowRoles.includes(profile.role)) {
          router.replace("/");
          return;
        }
        setAllowedPath(pathname);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        // Backend unreachable or another transient error: let the page's own
        // data fetching surface it rather than trapping the user on a blank guard.
        setAllowedPath(pathname);
      }
    }

    void run();
    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (allowedPath !== pathname) return null;

  return <>{children}</>;
}
