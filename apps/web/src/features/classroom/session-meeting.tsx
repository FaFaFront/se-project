"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Button, buttonVariants } from "@/components/ui/button";
import type { ClassroomSession } from "@/types/session";
import { sessionActions } from "./session-state";
import { JitsiMeeting } from "./jitsi-meeting";

export function SessionMeetingContent({
  session,
  now,
  hasJoined,
  displayName,
  onJoined,
}: {
  session: ClassroomSession;
  now: number;
  hasJoined: boolean;
  displayName: string;
  onJoined: () => void;
}) {
  const end = new Date(session.scheduledAt).getTime() + session.durationHours * 3_600_000;
  const canJoin = sessionActions(session, now).canJoin;
  const message =
    session.status === "missed"
      ? "This session was missed and nobody was charged. Ask the tutor to book a new session."
      : session.status === "cancelled"
        ? "This session was cancelled. Nobody will be charged."
        : session.paymentPending
          ? "Payment is pending. The system will retry automatically when enough funds are available."
          : session.status === "completed"
            ? "This session is completed. See your chat for the payment notice."
            : now < new Date(session.scheduledAt).getTime()
              ? "Joining opens at the scheduled start time."
              : "The attendance window has closed. Check the classroom for the session outcome.";
  const showMeeting =
    session.status !== "cancelled" && session.attendanceTrackingEnabled && (canJoin || hasJoined);
  return (
    <>
      {(!canJoin || session.paymentPending) && (
        <p
          role="status"
          className="rounded-2xl border border-hairline bg-surface-lavender p-5 text-ink/70"
        >
          {message}
        </p>
      )}
      {showMeeting && (
        <JitsiMeeting
          sessionId={session.id}
          meetLink={session.meetLink}
          endsAt={end}
          displayName={displayName}
          onJoined={onJoined}
        />
      )}
    </>
  );
}

export function SessionMeeting({
  classroomId,
  sessionId,
}: {
  classroomId: string;
  sessionId: string;
}) {
  const { profile } = useAuth();
  const [session, setSession] = useState<ClassroomSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestKey, setRequestKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [hasJoined, setHasJoined] = useState(false);
  const onJoined = useCallback(() => setHasJoined(true), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await apiClient.get<ClassroomSession>(
          `/sessions/${encodeURIComponent(sessionId)}`
        );
        if (!active) return;
        if (data.classroomId !== classroomId)
          throw new Error("Session not found in this classroom.");
        setSession(data);
        setError(null);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load the session.");
      }
    };
    void load();
    const refresh = setInterval(() => {
      void load();
    }, 15_000);
    return () => {
      active = false;
      clearInterval(refresh);
    };
  }, [classroomId, sessionId, requestKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const scheduledDate = session
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" }).format(
        new Date(session.scheduledAt)
      )
    : "";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href={`/classroom/${encodeURIComponent(classroomId)}`}
        className={buttonVariants({ variant: "outline" })}
      >
        Back to classroom
      </Link>
      <h1 className="font-outfit text-2xl font-bold text-ink">Session meeting</h1>
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRequestKey((key) => key + 1)}>
            Retry
          </Button>
        </div>
      )}
      {!session && !error && <p role="status">Loading session…</p>}
      {session && (
        <>
          <p className="text-sm text-ink/70">
            {scheduledDate} · {session.durationHours} hours
          </p>
          <p className="text-sm text-ink/70">
            Join through this page so your attendance can be saved. If both participants join,
            payment uses the booked duration and is processed 15 minutes after the scheduled end.
          </p>
          <SessionMeetingContent
            session={session}
            now={now}
            hasJoined={hasJoined}
            displayName={profile?.name ?? profile?.role ?? "Participant"}
            onJoined={onJoined}
          />
        </>
      )}
    </div>
  );
}
