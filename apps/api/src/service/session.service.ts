import { ClassroomStatus, MeetSessionStatus, Prisma } from "@prisma/client";
import {
  ConflictError,
  InsufficientBalanceError,
  NotFoundError,
} from "../common/errors/app-error.js";
import {
  JOINABLE_STATUSES,
  sessionCost,
  sessionRepository,
  type SessionListRow,
} from "../repository/session.repository.js";

/** The Join button becomes available this long before scheduledAt. */
const JOIN_WINDOW_LEAD_MS = 10 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export type ClassroomSessionItem = {
  id: string;
  scheduledAt: string;
  endsAt: string;
  joinWindowOpensAt: string;
  durationHours: number;
  status: MeetSessionStatus;
  cost: string;
  canJoinNow: boolean;
  viewerHasJoined: boolean;
};

function sessionTimes(scheduledAt: Date, durationHours: Prisma.Decimal) {
  return {
    opensAt: new Date(scheduledAt.getTime() - JOIN_WINDOW_LEAD_MS),
    endsAt: new Date(scheduledAt.getTime() + Number(durationHours) * HOUR_MS),
  };
}

function isWithinJoinWindow(opensAt: Date, endsAt: Date, now: Date) {
  return now >= opensAt && now <= endsAt;
}

function mapSession(
  session: SessionListRow,
  pricePerHour: Prisma.Decimal,
  classroomStatus: ClassroomStatus,
  viewerRole: "tutor" | "student",
  now: Date
): ClassroomSessionItem {
  const { opensAt, endsAt } = sessionTimes(session.scheduledAt, session.durationHours);
  return {
    id: session.id,
    scheduledAt: session.scheduledAt.toISOString(),
    endsAt: endsAt.toISOString(),
    joinWindowOpensAt: opensAt.toISOString(),
    durationHours: Number(session.durationHours),
    status: session.status,
    cost: sessionCost(pricePerHour, session.durationHours).toFixed(2),
    // A UI hint only; POST /sessions/:sessionId/join re-checks everything, including balance.
    canJoinNow:
      classroomStatus === ClassroomStatus.active &&
      JOINABLE_STATUSES.includes(session.status) &&
      isWithinJoinWindow(opensAt, endsAt, now),
    viewerHasJoined:
      (viewerRole === "tutor" ? session.tutorJoinedAt : session.studentJoinedAt) !== null,
  };
}

export const sessionService = {
  async listClassroomSessions(classroomId: string, viewerId: string) {
    const classroom = await sessionRepository.findClassroomForSessions(classroomId);
    // Same 404 as a missing classroom so non-participants can't probe which IDs exist.
    if (!classroom || (classroom.tutorId !== viewerId && classroom.studentId !== viewerId)) {
      throw new NotFoundError("Classroom not found");
    }
    const viewerRole = classroom.tutorId === viewerId ? "tutor" : "student";

    const now = new Date();
    const sessions = (await sessionRepository.findByClassroom(classroomId)).map((session) =>
      mapSession(session, classroom.pricePerHour, classroom.status, viewerRole, now)
    );

    const isUpcoming = (s: ClassroomSessionItem) =>
      JOINABLE_STATUSES.includes(s.status) && new Date(s.endsAt) > now;
    return {
      upcoming: sessions.filter(isUpcoming),
      // Most recent first.
      past: sessions.filter((s) => !isUpcoming(s)).reverse(),
    };
  },

  async joinSession(sessionId: string, userId: string) {
    const session = await sessionRepository.findForJoin(sessionId);
    const classroom = session?.classroom;
    if (
      !session ||
      !classroom ||
      (classroom.tutorId !== userId && classroom.studentId !== userId)
    ) {
      throw new NotFoundError("Session not found");
    }
    const role = classroom.tutorId === userId ? "tutor" : "student";

    if (classroom.status !== ClassroomStatus.active) {
      throw new ConflictError("This classroom is no longer active");
    }
    if (!JOINABLE_STATUSES.includes(session.status)) {
      throw new ConflictError(`Session is ${session.status} and can no longer be joined`);
    }

    const now = new Date();
    const { opensAt, endsAt } = sessionTimes(session.scheduledAt, session.durationHours);
    if (now < opensAt) {
      throw new ConflictError("The session can be joined from 10 minutes before it starts");
    }
    if (now > endsAt) {
      throw new ConflictError("The session has already ended");
    }

    // A student who already joined has this session's cost committed, so a re-join (e.g. after
    // a dropped connection) skips the balance gate.
    const checkBalance = role === "student" && session.studentJoinedAt === null;

    const result = await sessionRepository.join({
      sessionId,
      role,
      ...(checkBalance && { studentId: classroom.studentId }),
      now,
    });

    if (result.kind === "insufficient-balance") {
      throw new InsufficientBalanceError({
        required: result.required.toFixed(2),
        available: result.available.toFixed(2),
      });
    }
    if (result.kind === "not-joinable") {
      throw new ConflictError("Session changed while joining. Please reload and try again");
    }
    return { sessionId, meetLink: result.meetLink };
  },
};
