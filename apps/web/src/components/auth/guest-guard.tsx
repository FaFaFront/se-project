"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken } from "@/lib/auth-storage";
import type { UserProfile } from "@/types/user";

type GuestGuardProps = {
  children: ReactNode;
};

/**
 * Gate for pages that only make sense signed out (login, register): a
 * signed-in user is sent to wherever they belong instead — complete-profile
 * if their profile is unfinished, otherwise their profile page.
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function check() {
      if (!getToken()) {
        setAllowed(true);
        return;
      }

      try {
        const profile = await apiClient.get<UserProfile>("/users/me");
        if (!active) return;

        router.replace(profile.profileComplete ? "/" : `/complete-profile?role=${profile.role}`);
      } catch (error) {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) {
          clearSession();
        }
        // Invalid session or transient error: let the page render its own form.
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
