import { ClassroomStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { reviewSelect } from "./review.repository.js";

const classroomListSelect = {
  id: true,
  pricePerHour: true,
  status: true,
  createdAt: true,
  // Only what a tutor needs to recognise the student — never email or contact details.
  student: {
    select: {
      id: true,
      name: true,
      profileUrl: true,
    },
  },
  subject: {
    select: {
      id: true,
      name: true,
    },
  },
} as const;

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
    select: {
      id: true,
      classroomId: true,
      scheduledAt: true,
      durationHours: true,
      status: true,
      meetLink: true,
      meetSpaceName: true,
    },
    orderBy: [{ scheduledAt: "asc" as const }],
  },
  review: { select: reviewSelect },
} as const satisfies Prisma.ClassroomSelect;

export type ClassroomListRow = Prisma.ClassroomGetPayload<{ select: typeof classroomListSelect }>;
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
  /** Classrooms owned by `tutorId`, newest first, narrowed by every given filter (AND). */
  async findByTutor(tutorId: string, filter: ClassroomListFilter): Promise<ClassroomListRow[]> {
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
      select: classroomListSelect,
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
};
