import type { SessionRow } from "../../repository/session.repository.js";

type ScheduledSession = { scheduledAt: Date; durationMinutes: number };
const SESSION_DURATION_PRESETS = [5, 30, 60, 90, 120, 150, 180, 210, 240];
export const SESSION_DURATION_ERROR =
  "Duration must be 5 minutes or between 30 minutes and 4 hours in 30-minute steps";
export const SETTLEMENT_GRACE_MS = 60_000;

export function getSessionDurationMinutes(durationHours: number): number | undefined {
  return SESSION_DURATION_PRESETS.find((minutes) => minutes / 60 === durationHours);
}

export function scheduledEnd(session: ScheduledSession): Date {
  return new Date(session.scheduledAt.getTime() + session.durationMinutes * 60_000);
}

export function settlementDue(session: ScheduledSession, now: Date): boolean {
  return now.getTime() >= scheduledEnd(session).getTime() + SETTLEMENT_GRACE_MS;
}

export function attendanceOpen(session: ScheduledSession, now: Date): boolean {
  return now >= session.scheduledAt && now < scheduledEnd(session);
}

export function serializeSession(session: SessionRow, now = new Date()) {
  return {
    id: session.id,
    classroomId: session.classroomId,
    scheduledAt: session.scheduledAt.toISOString(),
    durationHours: session.durationMinutes / 60,
    status: session.status,
    meetLink: session.meetLink,
    meetSpaceName: session.meetSpaceName,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    tutorJoinedAt: session.tutorJoinedAt?.toISOString() ?? null,
    studentJoinedAt: session.studentJoinedAt?.toISOString() ?? null,
    amountCharged: session.amountCharged?.toFixed(2) ?? null,
    attendanceTrackingEnabled: session.attendanceTrackingEnabled,
    paymentPending:
      session.attendanceTrackingEnabled &&
      session.status === "ongoing" &&
      Boolean(session.tutorJoinedAt && session.studentJoinedAt) &&
      settlementDue(session, now),
  };
}
