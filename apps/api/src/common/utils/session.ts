import type { Prisma } from "@prisma/client";
import type { SessionRow } from "../../repository/session.repository.js";

type ScheduledSession = { scheduledAt: Date; durationHours: Prisma.Decimal };
export const SETTLEMENT_GRACE_MS = 15 * 60 * 1000;

export function scheduledEnd(session: ScheduledSession): Date {
  return new Date(session.scheduledAt.getTime() + Number(session.durationHours) * 3_600_000);
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
    durationHours: Number(session.durationHours),
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
