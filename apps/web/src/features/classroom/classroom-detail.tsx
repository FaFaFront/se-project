"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CalendarDays, CircleAlert, Clock3 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeleteClassroomAction } from "@/features/classroom/delete-classroom-action";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { formatCurrency } from "@/features/profile/profile-details";
import { ApiError, apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ClassroomDetail as ClassroomDetailData } from "@/types/classroom";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; classroom: ClassroomDetailData }
  | { status: "error"; kind: "not-found" | "forbidden" | "general"; message: string };

function formatCreatedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date);
}

function ErrorState({
  kind,
  message,
  onRetry,
}: {
  kind: "not-found" | "forbidden" | "general";
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
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [requestKey, setRequestKey] = useState(0);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setRequestKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });

    apiClient.get<ClassroomDetailData>(`/classrooms/${encodeURIComponent(classroomId)}`).then(
      (classroom) => {
        if (active) setState({ status: "ready", classroom });
      },
      (error: unknown) => {
        if (!active) return;

        const status = error instanceof ApiError ? error.status : undefined;
        // A malformed ID (400) can never succeed on retry, so treat it like a missing classroom.
        const kind =
          status === 404 || status === 400 ? "not-found" : status === 403 ? "forbidden" : "general";
        const message =
          kind === "not-found"
            ? "The classroom may have been removed or the link may be incorrect."
            : kind === "forbidden"
              ? "Your account is inactive. Reactivate it to view classroom details."
              : "Please check your connection and try again.";

        setState({
          status: "error",
          kind,
          message,
        });
      }
    );

    return () => {
      active = false;
    };
  }, [classroomId, requestKey]);

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
    return <ErrorState kind={state.kind} message={state.message} onRetry={retry} />;
  }

  const { classroom } = state;
  const participantName = classroom.participant.name?.trim() || "Profile not completed";
  const participantLabel = classroom.viewerRole === "tutor" ? "Assigned student" : "Assigned tutor";

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/classroom"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        My Classroom
      </Link>

      <section className="mt-6 overflow-hidden rounded-3xl border border-hairline bg-white shadow-sm">
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
                    {classroom.viewerRole === "tutor" ? "Student" : "Tutor"}
                  </p>
                </div>
              </div>
              {classroom.viewerRole === "tutor" && <DeleteClassroomAction />}
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
            {classroom.viewerRole === "tutor" && (
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
        </div>
      </section>
    </div>
  );
}
