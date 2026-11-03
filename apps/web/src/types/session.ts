export type SessionStatus = "scheduled" | "ongoing" | "completed" | "cancelled" | "missed";

export type ClassroomSession = {
  id: string;
  classroomId: string;
  /** ISO 8601 UTC datetime. */
  scheduledAt: string;
  durationHours: number;
  status: SessionStatus;
  meetLink: string;
  meetSpaceName: string | null;
  startedAt: string | null;
  endedAt: string | null;
  /** First successful Join Meet button check-ins; these do not verify conference entry. */
  tutorJoinedAt: string | null;
  studentJoinedAt: string | null;
  amountCharged: string | null;
  attendanceTrackingEnabled: boolean;
  paymentPending: boolean;
};

export type CreateSessionRequest = {
  /** ISO 8601 UTC datetime. */
  scheduledAt: string;
  durationHours: number;
};
