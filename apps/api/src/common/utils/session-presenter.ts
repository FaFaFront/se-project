import type { SessionRow } from "../../repository/session.repository.js";
import { settlementDue } from "./session-policy.js";

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
