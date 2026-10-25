import { MeetSessionStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

const sessionSelect = {
  id: true,
  classroomId: true,
  scheduledAt: true,
  durationHours: true,
  status: true,
  meetLink: true,
  meetSpaceName: true,
} as const satisfies Prisma.MeetSessionSelect;

export type SessionRow = Prisma.MeetSessionGetPayload<{ select: typeof sessionSelect }>;

export const sessionRepository = {
  async create(data: {
    classroomId: string;
    scheduledAt: Date;
    durationHours: Prisma.Decimal;
    meetLink: string;
    meetSpaceName: string;
  }): Promise<SessionRow> {
    return prisma.meetSession.create({ data, select: sessionSelect });
  },

  async findById(id: string) {
    return prisma.meetSession.findUnique({
      where: { id },
      select: {
        id: true,
        classroomId: true,
        scheduledAt: true,
        durationHours: true,
        status: true,
        meetLink: true,
        meetSpaceName: true,
        classroom: { select: { tutorId: true, studentId: true } },
      },
    });
  },

  async cancel(id: string): Promise<SessionRow> {
    return prisma.meetSession.update({
      where: { id },
      data: { status: MeetSessionStatus.cancelled },
      select: sessionSelect,
    });
  },

  /** Returns true if any non-cancelled session of this tutor or student overlaps [startAt, endAt). */
  async hasOverlap(
    tutorId: string,
    studentId: string,
    startAt: Date,
    endAt: Date,
    excludeId?: string
  ): Promise<boolean> {
    const sessions = await prisma.meetSession.findMany({
      where: {
        status: { not: MeetSessionStatus.cancelled },
        ...(excludeId && { id: { not: excludeId } }),
        classroom: { OR: [{ tutorId }, { studentId }] },
        scheduledAt: { lt: endAt },
      },
      select: { scheduledAt: true, durationHours: true },
    });

    return sessions.some((s) => {
      const existingEnd = new Date(s.scheduledAt.getTime() + Number(s.durationHours) * 3600 * 1000);
      return existingEnd > startAt;
    });
  },

  async cancelAllScheduledForClassroom(classroomId: string): Promise<void> {
    await prisma.meetSession.updateMany({
      where: { classroomId, status: MeetSessionStatus.scheduled },
      data: { status: MeetSessionStatus.cancelled },
    });
  },

  async hasOngoingForClassroom(classroomId: string): Promise<boolean> {
    const count = await prisma.meetSession.count({
      where: { classroomId, status: MeetSessionStatus.ongoing },
    });
    return count > 0;
  },
};
