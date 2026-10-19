import { ClassroomStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

const classroomSelect = {
  id: true,
  tutorId: true,
  studentId: true,
  subjectId: true,
  pricePerHour: true,
  status: true,
  createdAt: true,
} as const satisfies Prisma.ClassroomSelect;

export type ClassroomRow = Prisma.ClassroomGetPayload<{ select: typeof classroomSelect }>;

export const classroomRepository = {
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
      select: { id: true, tutorId: true, status: true },
    });
  },

  async completeActive(classroomId: string, tutorId: string) {
    return prisma.classroom.updateMany({
      where: { id: classroomId, tutorId, status: ClassroomStatus.active },
      data: { status: ClassroomStatus.completed },
    });
  },
};
