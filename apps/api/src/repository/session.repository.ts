import { MeetSessionStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { BadRequestError, ForbiddenError, NotFoundError } from "../common/errors/app-error.js";
import { attendanceOpen, settlementDue } from "../common/utils/session.js";

export const sessionSelect = {
  id: true,
  classroomId: true,
  scheduledAt: true,
  durationHours: true,
  status: true,
  meetLink: true,
  meetSpaceName: true,
  startedAt: true,
  endedAt: true,
  amountCharged: true,
  tutorJoinedAt: true,
  studentJoinedAt: true,
  attendanceTrackingEnabled: true,
} as const satisfies Prisma.MeetSessionSelect;

export type SessionRow = Prisma.MeetSessionGetPayload<{ select: typeof sessionSelect }>;

export async function lockSession(tx: Prisma.TransactionClient, id: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "meet_sessions" WHERE "id" = ${id} FOR UPDATE`;
}

export const sessionRepository = {
  findDueForSettlement(now: Date) {
    return prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "meet_sessions"
      WHERE "attendanceTrackingEnabled" = true AND "status" = 'ongoing'
        AND "scheduledAt" + ("durationHours" * INTERVAL '1 hour') + INTERVAL '15 minutes' <= ${now}
      ORDER BY "scheduledAt", "id"
    `;
  },

  findPendingSettlementNotices() {
    return prisma.meetSession.findMany({
      where: {
        attendanceTrackingEnabled: true,
        status: { in: ["completed", "missed"] },
        settlementNotifiedAt: null,
        amountCharged: { not: null },
        endedAt: { not: null },
      },
      select: { id: true },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    });
  },

  async create(data: {
    classroomId: string;
    scheduledAt: Date;
    durationHours: Prisma.Decimal;
    meetLink: string;
    meetSpaceName: string | null;
  }): Promise<SessionRow> {
    return prisma.$transaction(async (tx) => {
      // Coordinates with classroom deactivation; do not create into a completed classroom.
      const rows = await tx.$queryRaw<
        { status: string }[]
      >`SELECT "status" FROM "classrooms" WHERE "id" = ${data.classroomId} FOR UPDATE`;
      if (rows[0]?.status !== "active")
        throw new BadRequestError("Sessions require an active classroom");
      return tx.meetSession.create({
        data: { ...data, attendanceTrackingEnabled: true },
        select: sessionSelect,
      });
    });
  },

  findById(id: string) {
    return prisma.meetSession.findUnique({
      where: { id },
      select: { ...sessionSelect, classroom: { select: { tutorId: true, studentId: true } } },
    });
  },

  /** Saves the participant's first Join Meet click, not conference presence. */
  async recordAttendance(id: string, userId: string, now?: Date): Promise<SessionRow> {
    return prisma.$transaction(async (tx) => {
      await lockSession(tx, id);
      const session = await tx.meetSession.findUnique({
        where: { id },
        include: { classroom: true },
      });
      if (
        !session ||
        (session.classroom.tutorId !== userId && session.classroom.studentId !== userId)
      )
        throw new NotFoundError("Session not found");
      if (!session.attendanceTrackingEnabled || !["scheduled", "ongoing"].includes(session.status))
        throw new BadRequestError("Attendance cannot be recorded for this session");
      const observedNow = now ?? new Date();
      const field = session.classroom.tutorId === userId ? "tutorJoinedAt" : "studentJoinedAt";
      if (!attendanceOpen(session, observedNow))
        throw new BadRequestError("Attendance is accepted only during the scheduled session");
      if (session[field])
        return tx.meetSession.findUniqueOrThrow({ where: { id }, select: sessionSelect });
      return tx.meetSession.update({
        where: { id },
        data: { [field]: observedNow, startedAt: session.startedAt ?? observedNow },
        select: sessionSelect,
      });
    });
  },

  async cancel(id: string, tutorId: string, now?: Date): Promise<SessionRow> {
    return prisma.$transaction(async (tx) => {
      await lockSession(tx, id);
      const session = await tx.meetSession.findUnique({
        where: { id },
        include: { classroom: true },
      });
      if (!session) throw new NotFoundError("Session not found");
      if (session.classroom.tutorId !== tutorId)
        throw new ForbiddenError("Only the classroom tutor can cancel sessions");
      if (!["scheduled", "ongoing"].includes(session.status))
        throw new BadRequestError("Only scheduled or ongoing sessions can be cancelled");
      if (settlementDue(session, now ?? new Date()))
        throw new BadRequestError("The cancellation cutoff has passed; payment may be pending");
      return tx.meetSession.update({
        where: { id, status: session.status },
        data: { status: MeetSessionStatus.cancelled },
        select: sessionSelect,
      });
    });
  },

  async hasOverlap(
    tutorId: string,
    studentId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string
  ): Promise<boolean> {
    const sessions = await prisma.meetSession.findMany({
      where: {
        status: { notIn: [MeetSessionStatus.cancelled, MeetSessionStatus.missed] },
        ...(excludeId && { id: { not: excludeId } }),
        classroom: { OR: [{ tutorId }, { studentId }] },
        scheduledAt: { lt: endAt },
      },
      select: { scheduledAt: true, durationHours: true },
    });
    return sessions.some(
      (s) => s.scheduledAt.getTime() + Number(s.durationHours) * 3_600_000 > startAt.getTime()
    );
  },

  async advanceScheduled(now: Date): Promise<void> {
    await prisma.meetSession.updateMany({
      where: { attendanceTrackingEnabled: true, status: "scheduled", scheduledAt: { lte: now } },
      data: { status: "ongoing" },
    });
  },
};
