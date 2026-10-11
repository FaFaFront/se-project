import { prisma } from "../config/prisma.js";

export const classroomRepository = {
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
};
