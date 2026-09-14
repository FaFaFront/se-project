"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { getToken } from "@/lib/auth-storage";
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
 * one boundary, no per-route wiring.
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

type Verdict = { type: "allow" } | { type: "redirect"; to: string } | { type: "wait" };

function evaluate(rule: RouteRule, profile: UserProfile | null, hasToken: boolean): Verdict {
  if (rule.guest) {
    if (!hasToken) return { type: "allow" };
    if (!profile) return { type: "wait" };
    return { type: "redirect", to: profile.profileComplete ? "/" : "/complete-profile" };
  }

  if (!hasToken) return { type: "redirect", to: "/login" };
  if (!profile) return { type: "wait" };

  const requireProfileComplete = rule.requireProfileComplete ?? true;
  if (requireProfileComplete && !profile.profileComplete) {
    return { type: "redirect", to: "/complete-profile" };
  }
  if (rule.redirectIfProfileComplete && profile.profileComplete) {
    return { type: "redirect", to: "/" };
  }
  if (rule.allowRoles && !rule.allowRoles.includes(profile.role)) {
    return { type: "redirect", to: "/" };
  }
  return { type: "allow" };
}

/**
 * Client-side gate mounted once in the root layout, inside AuthProvider.
 * Matches the current path against `ROUTE_RULES` and redirects before
 * rendering children, so protected content never flashes on screen.
 * Unmatched paths (home, tutors, ...) render immediately for anyone signed
 * out or with a complete profile; a signed-in incomplete profile still gets
 * bounced to /complete-profile from there via the effect below — a brief
 * flash of that public page's (already-public) content is an acceptable
 * trade for not delaying first paint on every route for the common case.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isLoading, error, refresh } = useAuth();
  const rule = matchRule(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!rule) {
      if (profile && !profile.profileComplete) router.replace("/complete-profile");
      return;
    }

    const result = evaluate(rule, profile, Boolean(getToken()));
    if (result.type === "redirect") router.replace(result.to);
  }, [rule, profile, isLoading, router]);

  if (!rule) return <>{children}</>;

  if (error && !profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-ink">{error}</p>
        <Button variant="outline" onClick={() => void refresh()}>
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) return null;

  if (evaluate(rule, profile, Boolean(getToken())).type !== "allow") return null;

  return <>{children}</>;
}
