import { ClassroomStatus, MeetSessionStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

// meetLink and meetSpaceName are deliberately absent: the link is only handed out by the join endpoint.
const sessionListSelect = {
  id: true,
  scheduledAt: true,
  durationHours: true,
  status: true,
  tutorJoinedAt: true,
  studentJoinedAt: true,
} as const satisfies Prisma.MeetSessionSelect;

export type SessionListRow = Prisma.MeetSessionGetPayload<{ select: typeof sessionListSelect }>;

export const JOINABLE_STATUSES: MeetSessionStatus[] = [
  MeetSessionStatus.scheduled,
  MeetSessionStatus.ongoing,
];

export type JoinSessionInput = {
  sessionId: string;
  role: "tutor" | "student";
  /** Required for a student; the balance it must cover besides other unsettled joined sessions. */
  studentId?: string;
  cost?: Prisma.Decimal;
  now: Date;
};

export type JoinSessionResult =
  | { kind: "success"; meetLink: string }
  | { kind: "not-joinable" }
  | { kind: "insufficient-balance"; available: Prisma.Decimal };

export const sessionRepository = {
  findClassroomForSessions(classroomId: string) {
    return prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, tutorId: true, studentId: true, pricePerHour: true, status: true },
    });
  },

  findByClassroom(classroomId: string): Promise<SessionListRow[]> {
    return prisma.meetSession.findMany({
      where: { classroomId },
      select: sessionListSelect,
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    });
  },

  findForJoin(sessionId: string) {
    return prisma.meetSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        scheduledAt: true,
        durationHours: true,
        status: true,
        studentJoinedAt: true,
        classroom: {
          select: { tutorId: true, studentId: true, status: true, pricePerHour: true },
        },
      },
    });
  },

  /**
   * Re-checks the classroom and session status, applies the student balance gate, and records the first join, all
   * under a lock on the student's wallet so parallel joins can't both pass the balance check.
   */
  join(input: JoinSessionInput): Promise<JoinSessionResult> {
    return prisma.$transaction(
      async (tx) => {
        // Share-lock the classroom row so a concurrent deactivation (which updates that row)
        // waits for this transaction, or has already committed and is seen by this read.
        const classrooms = await tx.$queryRaw<{ status: string }[]>`
          SELECT c."status"::text AS "status"
          FROM "classrooms" c
          JOIN "meet_sessions" s ON s."classroomId" = c."id"
          WHERE s."id" = ${input.sessionId}
          FOR SHARE OF c
        `;
        if (classrooms[0]?.status !== ClassroomStatus.active) {
          return { kind: "not-joinable" } as const;
        }

        if (input.role === "student" && input.studentId && input.cost) {
          const users = await tx.$queryRaw<{ walletBalance: Prisma.Decimal }[]>`
            SELECT "walletBalance" FROM "users" WHERE "id" = ${input.studentId} FOR UPDATE
          `;
          const user = users[0];
          if (!user) return { kind: "not-joinable" } as const;

          // Sessions the student already joined but that haven't been charged yet.
          const reserved = await tx.meetSession.findMany({
            where: {
              id: { not: input.sessionId },
              studentJoinedAt: { not: null },
              amountCharged: null,
              status: { in: JOINABLE_STATUSES },
              classroom: { studentId: input.studentId },
            },
            select: { durationHours: true, classroom: { select: { pricePerHour: true } } },
          });
          const reservedTotal = reserved.reduce(
            (sum, s) => sum.plus(sessionCost(s.classroom.pricePerHour, s.durationHours)),
            new Prisma.Decimal(0)
          );
          const available = new Prisma.Decimal(user.walletBalance).minus(reservedTotal);
          if (available.lessThan(input.cost)) {
            return { kind: "insufficient-balance", available } as const;
          }
        }

        const joinedAtField = input.role === "tutor" ? "tutorJoinedAt" : "studentJoinedAt";
        // Only the first join is recorded; a re-join leaves the original timestamp untouched.
        await tx.meetSession.updateMany({
          where: { id: input.sessionId, [joinedAtField]: null, status: { in: JOINABLE_STATUSES } },
          data: { [joinedAtField]: input.now },
        });
        await tx.meetSession.updateMany({
          where: { id: input.sessionId, status: MeetSessionStatus.scheduled },
          data: { status: MeetSessionStatus.ongoing },
        });
        await tx.meetSession.updateMany({
          where: { id: input.sessionId, startedAt: null, status: MeetSessionStatus.ongoing },
          data: { startedAt: input.now },
        });

        const session = await tx.meetSession.findUnique({
          where: { id: input.sessionId },
          select: { status: true, meetLink: true },
        });
        // Cancelled or completed by someone else since the service checked it.
        if (!session || !JOINABLE_STATUSES.includes(session.status)) {
          return { kind: "not-joinable" } as const;
        }
        return { kind: "success", meetLink: session.meetLink } as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );
  },
};

/** pricePerHour × durationHours, rounded to the 2 decimals money is stored with. */
export function sessionCost(pricePerHour: Prisma.Decimal, durationHours: Prisma.Decimal) {
  return new Prisma.Decimal(pricePerHour)
    .times(durationHours)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
