import { Prisma } from "@prisma/client";
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
};
