import { ClassroomStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

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

export type ClassroomListRow = Prisma.ClassroomGetPayload<{ select: typeof classroomListSelect }>;
export type ClassroomRow = Prisma.ClassroomGetPayload<{ select: typeof classroomSelect }>;

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

  async findDetailById(classroomId: string) {
    return prisma.classroom.findUnique({
      where: { id: classroomId },
      select: {
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
      },
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
};
