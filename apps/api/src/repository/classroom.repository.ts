import { ClassroomStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const classroomRepository = {
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
