import type { ClassroomSession } from "@/types/session";

export function sessionActions(session: ClassroomSession, now: number) {
  const start = new Date(session.scheduledAt).getTime();
  const end = start + session.durationHours * 3_600_000;
  const active = session.status === "scheduled" || session.status === "ongoing";
  return {
    canJoin: active && session.attendanceTrackingEnabled && now >= start && now < end,
    canCancel: active && !session.paymentPending && now < end + 15 * 60_000,
  };
}
