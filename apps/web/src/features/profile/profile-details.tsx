"use client";

import { Pencil } from "lucide-react";

import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/user";

export interface ProfileDetailsProps {
  profile: UserProfile;
  className?: string;
  onEdit?: () => void;
  onToggleAccountStatus?: () => void;
  isStatusUpdating?: boolean;
  statusError?: string | null;
  statusMessage?: string | null;
}

const EMPTY = "Not set yet";

// Only primary/ink/ink-black are declared with <alpha-value> in tailwind.config,
// so an opacity modifier on any other token silently falls back to a wrong colour
// (hairline/70 renders Tailwind's default grey, success/10 renders transparent).
// Every other token below is used at full strength on purpose.
const CARD = "rounded-[10px] border border-hairline bg-canvas shadow-sm";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatJoinedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

/** A read-only value, styled like a disabled input so it reads as "this came from somewhere real". */
function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="gap-xs flex flex-col">
      <span className="text-ink-black text-sm font-medium">{label}</span>
      <div
        className={cn(
          "bg-surface-disabled rounded-lg px-3.5 py-2.5 text-sm",
          value ? "text-ink" : "text-placeholder"
        )}
      >
        {value || EMPTY}
      </div>
    </div>
  );
}

/** Read-only view of the signed-in user's profile. */
export function ProfileDetails({
  profile,
  className,
  onEdit,
  onToggleAccountStatus,
  isStatusUpdating,
  statusError,
  statusMessage,
}: ProfileDetailsProps) {
  const isStudent = profile.role === "student";
  const isActive = profile.accountStatus === "ACTIVE";

  return (
    <div className={cn("gap-base flex flex-col", className)}>
      <section className={cn(CARD, "overflow-hidden")}>
        <div className="from-brand-plum-deepest via-primary to-amber-200 h-24 bg-gradient-to-r sm:h-28" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="gap-base -mt-12 flex flex-col items-start justify-between sm:-mt-14 sm:flex-row sm:items-end">
            <div className="gap-base flex items-end">
              <ProfileAvatar
                src={profile.profileUrl}
                name={profile.name}
                size={96}
                className="ring-canvas ring-4"
              />
              <div className="min-w-0 pb-1">
                <h1 className="text-heading-md text-ink-black max-w-full truncate">
                  {profile.name ?? "Your profile"}
                </h1>
                <p className="text-ink/60 truncate text-sm">{profile.email}</p>
              </div>
            </div>

            <div className="gap-sm flex items-center">
              <span className="bg-primary/5 text-primary shrink-0 rounded-lg px-3 py-1 text-xs font-semibold capitalize">
                {profile.role}
              </span>
              {onEdit && (
                <Button type="button" onClick={onEdit} className="shrink-0">
                  <Pencil aria-hidden="true" className="size-4 shrink-0" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className={cn(CARD, "p-6 sm:p-8")}>
        <div className="gap-x-xl gap-y-lg grid sm:grid-cols-2">
          <ReadOnlyField label="Full name" value={profile.name} />
          <ReadOnlyField label="Email" value={profile.email} />

          {isStudent ? (
            <>
              <ReadOnlyField label="Grade level" value={profile.gradeLevel} />
              <ReadOnlyField label="Member since" value={formatJoinedDate(profile.createdAt)} />
            </>
          ) : (
            <>
              <ReadOnlyField
                label="Hourly rate"
                value={
                  profile.hourlyRate === null
                    ? EMPTY
                    : `${formatCurrency(profile.hourlyRate)} / hour`
                }
              />
              <ReadOnlyField label="Member since" value={formatJoinedDate(profile.createdAt)} />
            </>
          )}

          <ReadOnlyField label="Wallet balance" value={formatCurrency(profile.walletBalance)} />

          {!isStudent && (
            <div className="gap-xs flex flex-col">
              <span className="text-ink-black text-sm font-medium">Account status</span>
              <div className="bg-surface-disabled flex items-center justify-between rounded-lg px-3.5 py-2.5">
                <span
                  className={cn("text-sm font-semibold", isActive ? "text-success" : "text-error")}
                >
                  {isActive ? "Active" : "Inactive"}
                </span>
                <button
                  type="button"
                  aria-label={isActive ? "Deactivate account" : "Activate account"}
                  aria-pressed={isActive}
                  disabled={!onToggleAccountStatus || isStatusUpdating}
                  onClick={onToggleAccountStatus}
                  className={cn(
                    "focus-visible:ring-primary/20 relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:ring-4 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                    isActive ? "bg-success" : "bg-ink/20"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                      isActive ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {(statusError || statusMessage || isStatusUpdating) && !isStudent && (
          <p
            className={cn(
              "mt-3 text-xs font-medium",
              statusError ? "text-error" : statusMessage ? "text-success" : "text-ink/60"
            )}
          >
            {statusError ?? statusMessage ?? "Updating account status…"}
          </p>
        )}

        <div className="border-hairline mt-lg gap-lg flex flex-col border-t pt-6">
          <div className="gap-xs flex flex-col">
            <span className="text-ink-black text-sm font-medium">About</span>
            <p className={cn("text-sm", profile.bio ? "text-ink" : "text-placeholder")}>
              {profile.bio || EMPTY}
            </p>
          </div>

          {isStudent ? (
            <div className="gap-xs flex flex-col">
              <span className="text-ink-black text-sm font-medium">Learning goals</span>
              <p className={cn("text-sm", profile.goals ? "text-ink" : "text-placeholder")}>
                {profile.goals || EMPTY}
              </p>
            </div>
          ) : (
            <div className="gap-xs flex flex-col">
              <span className="text-ink-black text-sm font-medium">Subjects you teach</span>
              {profile.subjects.length === 0 ? (
                <span className="text-placeholder text-sm">{EMPTY}</span>
              ) : (
                <ul className="gap-sm flex flex-wrap">
                  {profile.subjects.map((subject) => (
                    <li
                      key={subject.id}
                      className="border-hairline text-ink rounded-lg border px-3 py-1 text-sm"
                    >
                      {subject.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
