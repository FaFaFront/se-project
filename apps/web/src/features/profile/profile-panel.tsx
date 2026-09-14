"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { ProfileDetails } from "@/features/profile/profile-details";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, apiClient } from "@/lib/api-client";
import type { UserProfile } from "@/types/user";

/**
 * Renders the signed-in user's profile. Reads from AuthContext rather than
 * fetching its own copy — the route guard (`AuthGuard`) already blocks
 * this page behind a loaded profile, so `profile` is never null here.
 */
export function ProfilePanel() {
  const router = useRouter();
  const { profile, refresh, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    await logout();
  }, [logout]);

  const handleAccountStatusToggle = useCallback(async () => {
    if (!profile) return;

    const nextStatus = profile.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setIsStatusUpdating(true);
    setStatusError(null);
    setStatusMessage(null);

    try {
      await apiClient.patch<UserProfile>("/users/me/status", { status: nextStatus });
      await refresh();
      setStatusMessage(
        nextStatus === "INACTIVE"
          ? "Account is now inactive. Your data has been kept."
          : "Account is now active."
      );
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout();
        return;
      }
      setStatusError(
        error instanceof Error ? error.message : "Unable to update your account status."
      );
    } finally {
      setIsStatusUpdating(false);
    }
  }, [logout, profile, refresh, router]);

  if (!profile) return null;

  return (
    <ProfileDetails
      profile={profile}
      onLogout={handleLogout}
      isLoggingOut={isLoggingOut}
      onToggleAccountStatus={handleAccountStatusToggle}
      isStatusUpdating={isStatusUpdating}
      statusError={statusError}
      statusMessage={statusMessage}
    />
  );
}
