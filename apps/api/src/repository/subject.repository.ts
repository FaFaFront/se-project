import type { Subject } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const subjectRepository = {
  async findAll(): Promise<Subject[]> {
    return prisma.subject.findMany({ orderBy: { name: "asc" } });
  },

  async findByIds(subjectIds: string[]): Promise<Pick<Subject, "id">[]> {
    if (subjectIds.length === 0) {
      return [];
    }

    return prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true },
    });
  },
};
