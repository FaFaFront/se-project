export type SessionStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export type ClassroomSession = {
  id: string;
  classroomId: string;
  /** ISO 8601 UTC datetime. */
  scheduledAt: string;
  durationHours: number;
  status: SessionStatus;
  meetLink: string;
  meetSpaceName: string | null;
};

export type CreateSessionRequest = {
  /** ISO 8601 UTC datetime. */
  scheduledAt: string;
  durationHours: number;
};
