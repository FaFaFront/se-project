"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { ProfileDetails } from "@/components/profile/profile-details";
import { Button } from "@/components/ui/button";
import { ApiError, apiClient } from "@/lib/api-client";
import { clearSession, getToken } from "@/lib/auth-storage";
import type { UserProfile } from "@/types/user";

const LOAD_ERROR = "Unable to load your profile.";
const NETWORK_ERROR = "Unable to reach the server. Please try again.";

const SKELETON_CARD = "rounded-[10px] border border-hairline bg-canvas shadow-sm";

function ProfileSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="gap-base grid animate-pulse items-start lg:grid-cols-3"
    >
      <span className="sr-only">Loading your profile…</span>

      <div className={`${SKELETON_CARD} flex flex-col items-center px-6 py-8`}>
        <div className="bg-surface-disabled size-[120px] rounded-full" />
        <div className="bg-surface-disabled mt-5 h-6 w-40 rounded-md" />
        <div className="bg-surface-disabled mt-3 h-5 w-20 rounded-lg" />
        <div className="bg-surface-disabled mt-4 h-4 w-44 rounded-md" />
        <div className="border-hairline gap-lg mt-6 flex w-full flex-col border-t pt-6">
          <div className="bg-surface-disabled h-9 w-32 rounded-md" />
          <div className="bg-surface-disabled h-9 w-32 rounded-md" />
        </div>
      </div>

      <div className={`${SKELETON_CARD} gap-xl flex flex-col px-6 py-8 sm:px-8 lg:col-span-2`}>
        <div className="gap-xs flex flex-col">
          <div className="bg-surface-disabled h-4 w-20 rounded-md" />
          <div className="bg-surface-disabled h-4 w-full rounded-md" />
        </div>
        <div className="border-hairline border-t" />
        <div className="gap-xs flex flex-col">
          <div className="bg-surface-disabled h-4 w-24 rounded-md" />
          <div className="bg-surface-disabled h-4 w-40 rounded-md" />
        </div>
        <div className="border-hairline border-t" />
        <div className="gap-xs flex flex-col">
          <div className="bg-surface-disabled h-4 w-28 rounded-md" />
          <div className="bg-surface-disabled h-4 w-2/3 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/**
 * Loads the signed-in user's profile and hands it to the view. Kept separate
 * from the page so the route itself stays a server component and can export
 * metadata, and because the session token lives in localStorage — only the
 * browser can read it.
 */
export function ProfilePanel() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  /** A token the API rejects is worse than no token — drop it and start over. */
  const endSession = useCallback(() => {
    clearSession();
    router.replace("/login");
  }, [router]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      setProfile(await apiClient.get<UserProfile>("/users/me"));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        endSession();
        return;
      }
      if (error instanceof TypeError) {
        setLoadError(NETWORK_ERROR);
      } else {
        setLoadError(error instanceof Error && error.message ? error.message : LOAD_ERROR);
      }
    } finally {
      setIsLoading(false);
    }
  }, [endSession]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    void load();
  }, [load, router]);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (loadError) {
    return (
      <section
        role="alert"
        className="border-hairline bg-canvas flex flex-col items-center gap-4 rounded-[10px] border px-6 py-16 text-center shadow-sm"
      >
        <span className="border-hairline flex size-12 items-center justify-center rounded-full border">
          <AlertCircle aria-hidden="true" className="text-error size-6" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-outfit text-ink-black text-xl font-bold">
            We couldn&apos;t load your profile
          </h1>
          <p className="font-inter text-caption text-ink">{loadError}</p>
        </div>
        <Button type="button" onClick={() => void load()}>
          Try again
        </Button>
      </section>
    );
  }

  if (!profile) return null;

  return <ProfileDetails profile={profile} />;
}
