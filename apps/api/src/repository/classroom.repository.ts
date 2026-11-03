import { ClassroomStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { reviewSelect } from "./review.repository.js";
import { sessionSelect } from "./session.repository.js";
import { BadRequestError, NotFoundError } from "../common/errors/app-error.js";

// Only what a viewer needs to recognise the other participant — never email or contact details.
const participantSummarySelect = {
  id: true,
  name: true,
  profileUrl: true,
} as const;

const classroomListSelectForTutor = {
  id: true,
  pricePerHour: true,
  status: true,
  createdAt: true,
  student: { select: participantSummarySelect },
  subject: { select: { id: true, name: true } },
} as const satisfies Prisma.ClassroomSelect;

const classroomListSelectForStudent = {
  id: true,
  pricePerHour: true,
  status: true,
  createdAt: true,
  tutor: { select: participantSummarySelect },
  subject: { select: { id: true, name: true } },
} as const satisfies Prisma.ClassroomSelect;

const classroomSelect = {
  id: true,
  tutorId: true,
  studentId: true,
  subjectId: true,
  pricePerHour: true,
  status: true,
  createdAt: true,
} as const satisfies Prisma.ClassroomSelect;

const classroomDetailSelect = {
  id: true,
  tutorId: true,
  studentId: true,
  pricePerHour: true,
  status: true,
  createdAt: true,
  subject: {
    select: {
      id: true,
      name: true,
    },
  },
  tutor: {
    select: {
      id: true,
      name: true,
      profileUrl: true,
    },
  },
  student: {
    select: {
      id: true,
      name: true,
      profileUrl: true,
    },
  },
  sessions: {
    select: sessionSelect,
    orderBy: [{ scheduledAt: "asc" as const }],
  },
  review: { select: reviewSelect },
} as const satisfies Prisma.ClassroomSelect;

export type ClassroomListRowForTutor = Prisma.ClassroomGetPayload<{
  select: typeof classroomListSelectForTutor;
}>;
export type ClassroomListRowForStudent = Prisma.ClassroomGetPayload<{
  select: typeof classroomListSelectForStudent;
}>;
export type ClassroomRow = Prisma.ClassroomGetPayload<{ select: typeof classroomSelect }>;
export type ClassroomDetailRow = Prisma.ClassroomGetPayload<{
  select: typeof classroomDetailSelect;
}>;

export type ClassroomListFilter = {
  search?: string;
  subjectId?: string;
  /** Omit to include every status. */
  status?: ClassroomStatus;
};

export const classroomRepository = {
  async deactivateWithSessions(classroomId: string, tutorId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "classrooms" WHERE "id" = ${classroomId} FOR UPDATE`;
      const classroom = await tx.classroom.findUnique({ where: { id: classroomId } });
      if (!classroom || classroom.tutorId !== tutorId)
        throw new NotFoundError("Classroom not found");
      if (classroom.status === "completed") return;
      await tx.$queryRaw`SELECT "id" FROM "meet_sessions" WHERE "classroomId" = ${classroomId} ORDER BY "id" FOR UPDATE`;
      const now = new Date();
      const unsettled = await tx.meetSession.count({
        where: {
          classroomId,
          OR: [{ status: "ongoing" }, { status: "scheduled", scheduledAt: { lte: now } }],
        },
      });
      if (unsettled > 0)
        throw new BadRequestError(
          "Cannot deactivate a classroom with an ongoing or payment-pending session"
        );
      await tx.meetSession.updateMany({
        where: { classroomId, status: "scheduled" },
        data: { status: "cancelled" },
      });
      await tx.classroom.update({ where: { id: classroomId }, data: { status: "completed" } });
    });
  },
  /** Classrooms owned by `tutorId`, newest first, narrowed by every given filter (AND). */
  async findByTutor(
    tutorId: string,
    filter: ClassroomListFilter
  ): Promise<ClassroomListRowForTutor[]> {
    const { search, subjectId, status } = filter;

    return prisma.classroom.findMany({
      where: {
        tutorId,
        ...(subjectId && { subjectId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { student: { name: { contains: search, mode: "insensitive" } } },
            { subject: { name: { contains: search, mode: "insensitive" } } },
          ],
        }),
      },
      select: classroomListSelectForTutor,
      // id breaks ties between classrooms created in the same instant.
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  },

  /** Classrooms attended by `studentId`, newest first, narrowed by every given filter (AND). */
  async findByStudent(
    studentId: string,
    filter: ClassroomListFilter
  ): Promise<ClassroomListRowForStudent[]> {
    const { search, subjectId, status } = filter;

    return prisma.classroom.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { tutor: { name: { contains: search, mode: "insensitive" } } },
            { subject: { name: { contains: search, mode: "insensitive" } } },
          ],
        }),
      },
      select: classroomListSelectForStudent,
      // id breaks ties between classrooms created in the same instant.
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    });
  },

  async findDetailById(classroomId: string): Promise<ClassroomDetailRow | null> {
    return prisma.classroom.findUnique({
      where: { id: classroomId },
      select: classroomDetailSelect,
    });
  },

  async create(data: {
    tutorId: string;
    studentId: string;
    subjectId: string;
    pricePerHour: Prisma.Decimal;
  }): Promise<ClassroomRow> {
    return prisma.classroom.create({
      data,
      select: classroomSelect,
    });
  },

  async findById(classroomId: string) {
    return prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, tutorId: true, studentId: true, status: true },
    });
  },

  /** Only an active classroom owned by `tutorId` is changed; `count` is 0 otherwise. */
  async updateActiveDetails(
    classroomId: string,
    tutorId: string,
    data: { subjectId: string; pricePerHour: Prisma.Decimal }
  ) {
    return prisma.classroom.updateMany({
      where: { id: classroomId, tutorId, status: ClassroomStatus.active },
      data,
    });
  },

  async completeActive(classroomId: string, tutorId: string) {
    return prisma.classroom.updateMany({
      where: { id: classroomId, tutorId, status: ClassroomStatus.active },
      data: { status: ClassroomStatus.completed },
    });
  },

  async countActiveByTutor(tutorId: string): Promise<number> {
    return prisma.classroom.count({ where: { tutorId, status: ClassroomStatus.active } });
  },
};
