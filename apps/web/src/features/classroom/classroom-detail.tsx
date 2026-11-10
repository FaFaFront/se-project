"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Clock3,
  Pencil,
  Video,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeactivateClassroomAction } from "@/features/classroom/deactivate-classroom-action";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { formatCurrency } from "@/features/profile/profile-details";
import { ClassroomReview } from "@/features/reviews/classroom-review";
import { cn } from "@/lib/utils";
import type { ClassroomSession } from "@/types/session";
import { CancelSessionAction } from "./cancel-session-action";
import { CreateSessionForm } from "./create-session-form";
import { useClassroomDetail, type ClassroomErrorKind } from "./use-classroom-detail";
import { sessionActions } from "./session-state";
import { JoinSessionAction } from "./join-session-action";

function formatCreatedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}

function formatSessionDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(
    new Date(isoDate)
  );
}

function formatDuration(hours: number): string {
  const durationMinutes = Math.round(hours * 60);
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

const SESSION_STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  completed: "Completed",
  cancelled: "Cancelled",
  missed: "Missed",
};

const SESSION_STATUS_CLASS: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  ongoing: "bg-green-50 text-green-700",
  completed: "bg-green-50 text-green-700",
  cancelled: "bg-red-50 text-red-600",
  missed: "bg-amber-50 text-amber-800",
};

function sortSessions(sessions: ClassroomSession[]): ClassroomSession[] {
  const byDate = (a: ClassroomSession, b: ClassroomSession) =>
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  const active = sessions.filter((s) => s.status !== "cancelled").sort(byDate);
  const cancelled = sessions.filter((s) => s.status === "cancelled").sort((a, b) => -byDate(a, b));
  return [...active, ...cancelled];
}

function SessionList({
  sessions,
  isTutor,
  onSessionCancelled,
}: {
  sessions: ClassroomSession[];
  isTutor: boolean;
  onSessionCancelled?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  if (sessions.length === 0) {
    return <p className="text-sm text-ink/60">No sessions scheduled yet.</p>;
  }

  return (
    <div className="max-h-60 overflow-y-auto">
      <ul className="space-y-3 pb-1">
        {sortSessions(sessions).map((session) => {
          const { canCancel, canJoin } = sessionActions(session, now);
          const showLink = session.status === "scheduled" || session.status === "ongoing";
          return (
            <li
              key={session.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-lavender/40 px-5 py-4"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Video aria-hidden="true" className="size-4 shrink-0 text-primary" />
                <span className="truncate text-sm font-semibold text-ink">
                  {formatSessionDateTime(session.scheduledAt)}
                </span>
                <span className="shrink-0 text-sm text-ink/60">
                  {formatDuration(session.durationHours)}
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    SESSION_STATUS_CLASS[session.paymentPending ? "missed" : session.status] ??
                      "bg-surface-lavender text-ink/60"
                  )}
                >
                  {session.paymentPending
                    ? "Payment pending"
                    : (SESSION_STATUS_LABEL[session.status] ?? session.status)}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {showLink && (
                  <JoinSessionAction
                    sessionId={session.id}
                    disabled={!canJoin}
                    unavailableLabel={
                      now < new Date(session.scheduledAt).getTime()
                        ? "Join at start time"
                        : "Joining closed"
                    }
                  />
                )}
                {isTutor && canCancel && (
                  <CancelSessionAction session={session} onSuccess={onSessionCancelled} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-ink/70">
        Press Join Meet during the booked time to record your attendance check-in.
      </p>
      {sessions.some((session) => session.status === "missed") && (
        <p className="mt-3 text-sm text-ink/70">
          Missed sessions are not charged. Ask the tutor to book a new session.
        </p>
      )}
    </div>
  );
}

export function ClassroomErrorState({
  kind,
  message,
  onRetry,
}: {
  kind: ClassroomErrorKind;
  message: string;
  onRetry: () => void;
}) {
  const heading =
    kind === "not-found"
      ? "Classroom not found"
      : kind === "forbidden"
        ? "Your account is inactive"
        : "We couldn't load this classroom";

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-hairline bg-white px-6 py-12 text-center shadow-sm">
      <CircleAlert aria-hidden="true" className="size-10 text-primary" />
      <h1 className="mt-5 font-outfit text-2xl font-bold text-ink">{heading}</h1>
      <p className="mt-2 text-sm text-ink/70">{message}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        {kind === "general" && (
          <button type="button" onClick={onRetry} className={buttonVariants()}>
            Try again
          </button>
        )}
        <Link href="/classroom" className={buttonVariants({ variant: "outline" })}>
          Back to My Classroom
        </Link>
      </div>
    </section>
  );
}

export function ClassroomDetail({ classroomId }: { classroomId: string }) {
  const { state, retry } = useClassroomDetail(classroomId);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl" role="status" aria-live="polite">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-lavender" />
        <div className="mt-6 h-72 animate-pulse rounded-3xl bg-surface-lavender" />
        <span className="sr-only">Loading classroom details</span>
      </div>
    );
  }

  if (state.status === "error") {
    return <ClassroomErrorState kind={state.kind} message={state.message} onRetry={retry} />;
  }

  const { classroom } = state;
  const participantName = classroom.participant.name?.trim() || "Profile not completed";
  const participantLabel = classroom.viewerRole === "tutor" ? "Assigned student" : "Assigned tutor";

  const isTutor = classroom.viewerRole === "tutor";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/classroom"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          My Classroom
        </Link>
        {isTutor && classroom.status === "active" && (
          <Link
            href={`/classroom/${encodeURIComponent(classroom.id)}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil aria-hidden="true" className="size-4" />
            Edit classroom
          </Link>
        )}
      </div>

      <section className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm">
        <div className="bg-brand-plum-deepest px-6 py-7 text-white sm:px-9">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/70">Classroom details</p>
              <h1 className="mt-1 break-words font-outfit text-3xl font-bold">
                {classroom.subject.name}
              </h1>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm font-semibold capitalize",
                classroom.status === "active"
                  ? "bg-success/20 text-success"
                  : "bg-white/15 text-white"
              )}
            >
              {classroom.status}
            </span>
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-9">
          <div>
            <p className="text-sm font-semibold text-ink/60">{participantLabel}</p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-5">
              <div className="flex min-w-0 items-center gap-4">
                <ProfileAvatar
                  src={classroom.participant.profileUrl}
                  name={participantName}
                  size={64}
                />
                <div className="min-w-0">
                  <p className="break-words text-lg font-semibold text-ink">{participantName}</p>
                  <p className="mt-0.5 text-sm capitalize text-ink/60">
                    {isTutor ? "Student" : "Tutor"}
                  </p>
                </div>
              </div>
              {isTutor && classroom.status === "active" && (
                <DeactivateClassroomAction key={classroom.id} classroomId={classroom.id} />
              )}
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface-lavender/60 p-5">
              <dt className="flex items-center gap-2 text-sm font-medium text-ink/60">
                <BookOpen aria-hidden="true" className="size-4" /> Subject
              </dt>
              <dd className="mt-2 break-words font-semibold text-ink">{classroom.subject.name}</dd>
            </div>
            <div className="rounded-2xl bg-surface-lavender/60 p-5">
              <dt className="flex items-center gap-2 text-sm font-medium text-ink/60">
                <Clock3 aria-hidden="true" className="size-4" /> Price per hour
              </dt>
              <dd className="mt-2 font-semibold text-ink">
                {formatCurrency(classroom.pricePerHour)}
              </dd>
            </div>
            {isTutor && (
              <div className="rounded-2xl bg-surface-lavender/60 p-5 sm:col-span-2">
                <dt className="flex items-center gap-2 text-sm font-medium text-ink/60">
                  <CalendarDays aria-hidden="true" className="size-4" /> Created
                </dt>
                <dd className="mt-2 font-semibold text-ink">
                  <time dateTime={classroom.createdAt}>
                    {formatCreatedDate(classroom.createdAt)}
                  </time>
                </dd>
              </div>
            )}
          </dl>

          <ClassroomReview key={classroom.id} classroom={classroom} />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm">
        <div className="space-y-4 p-6 sm:p-9">
          <h2 className="font-outfit text-xl font-bold text-ink">Sessions</h2>
          <SessionList sessions={classroom.sessions} isTutor={isTutor} onSessionCancelled={retry} />
        </div>
      </section>

      {isTutor && classroom.status === "active" && (
        <CreateSessionForm classroomId={classroom.id} onSuccess={retry} />
      )}
    </div>
  );
}
