"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken } from "@/lib/auth-storage";
import type { UserRole } from "@/types/auth";
import type { UserProfile } from "@/types/user";

type RouteGuardProps = {
  children: ReactNode;
  /** Roles allowed to view this route. Omit to allow any signed-in role. */
  allowRoles?: UserRole[];
  /** Set false on the complete-profile route itself, which must stay reachable while incomplete. */
  requireProfileComplete?: boolean;
  /** Set true on the complete-profile route so a finished profile bounces to /profile instead of re-showing the form. */
  redirectIfProfileComplete?: boolean;
};

/**
 * Client-side gate for pages that need a signed-in user: fetches the
 * authoritative profile from `/users/me` (role/completion can't be trusted
 * from localStorage alone) and redirects before rendering children, so
 * protected content never flashes on screen.
 */
export function RouteGuard({
  children,
  allowRoles,
  requireProfileComplete = true,
  redirectIfProfileComplete = false,
}: RouteGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }

      try {
        const profile = await apiClient.get<UserProfile>("/users/me");
        if (!active) return;

        if (requireProfileComplete && !profile.profileComplete) {
          router.replace(`/complete-profile?role=${profile.role}`);
          return;
        }

        if (redirectIfProfileComplete && profile.profileComplete) {
          router.replace("/");
          return;
        }

        if (allowRoles && !allowRoles.includes(profile.role)) {
          router.replace("/");
          return;
        }

        setAllowed(true);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }
        // Backend unreachable or another transient error: let the page's own
        // data fetching surface it rather than trapping the user on a blank guard.
        setAllowed(true);
      }
    }

    void check();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!allowed) return null;

  return <>{children}</>;
}
