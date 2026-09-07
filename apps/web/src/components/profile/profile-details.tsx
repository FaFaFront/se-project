"use client";

import { Mail } from "lucide-react";

import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/user";

export interface ProfileDetailsProps {
  profile: UserProfile;
  className?: string;
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="gap-xs flex flex-col">
      <span className="text-ink/60 text-xs font-semibold tracking-wide uppercase">{label}</span>
      <span className="text-ink-black text-body-emphasis">{value}</span>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="gap-xs text-body-md flex flex-col">
      <dt className="text-label-md text-ink-black">{label}</dt>
      {/* The size token stays on the wrapper: passing it and a text colour through
          cn() together lets tailwind-merge drop one of them. */}
      <dd className={value ? "text-ink" : "text-placeholder"}>{value || EMPTY}</dd>
    </div>
  );
}

/** Read-only view of the signed-in user's profile. */
export function ProfileDetails({ profile, className }: ProfileDetailsProps) {
  const isStudent = profile.role === "student";

  return (
    <div className={cn("gap-base grid items-start lg:grid-cols-3", className)}>
      <section className={cn(CARD, "flex flex-col items-center px-6 py-8 text-center")}>
        <ProfileAvatar
          src={profile.profileUrl}
          name={profile.name}
          size={120}
          className="ring-primary/10 ring-4"
        />

        <h1 className="text-heading-md text-ink-black mt-5 max-w-full truncate">
          {profile.name ?? "Your profile"}
        </h1>

        <span className="bg-primary/5 text-primary mt-2 rounded-lg px-3 py-1 text-xs font-semibold capitalize">
          {profile.role}
        </span>

        <p className="text-ink gap-sm mt-4 flex w-full min-w-0 items-center justify-center text-sm">
          <Mail aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{profile.email}</span>
        </p>

        <div className="border-hairline gap-lg mt-6 flex w-full flex-col border-t pt-6 text-left">
          <MetaRow label="Wallet balance" value={formatCurrency(profile.walletBalance)} />
          <MetaRow label="Member since" value={formatJoinedDate(profile.createdAt)} />
          {!isStudent && (
            <MetaRow
              label="Hourly rate"
              value={
                profile.hourlyRate === null ? EMPTY : `${formatCurrency(profile.hourlyRate)} / hour`
              }
            />
          )}
        </div>
      </section>

      <section className={cn(CARD, "gap-xl flex flex-col px-6 py-8 sm:px-8 lg:col-span-2")}>
        <dl className="gap-xl flex flex-col">
          <Field label="About" value={profile.bio} />

          {isStudent ? (
            <>
              <div className="border-hairline border-t" />
              <Field label="Grade level" value={profile.gradeLevel} />
              <div className="border-hairline border-t" />
              <Field label="Learning goals" value={profile.goals} />
            </>
          ) : (
            <>
              <div className="border-hairline border-t" />
              <div className="gap-xs flex flex-col">
                <dt className="text-label-md text-ink-black">Subjects you teach</dt>
                <dd>
                  {profile.subjects.length === 0 ? (
                    <span className="text-placeholder text-body-md">{EMPTY}</span>
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
                </dd>
              </div>
            </>
          )}
        </dl>
      </section>
    </div>
  );
}
