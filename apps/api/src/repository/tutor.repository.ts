import { prisma } from "../config/prisma.js";

export const tutorRepository = {
  async findSubjectAssignment(tutorId: string, subjectId: string) {
    return prisma.tutorSubject.findUnique({
      where: { tutorId_subjectId: { tutorId, subjectId } },
    });
  },

  async findHourlyRate(tutorId: string) {
    return prisma.user.findUnique({
      where: { id: tutorId },
      select: { hourlyRate: true },
    });
  },
};
