import type { Subject } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const subjectRepository = {
  async findAll(): Promise<Subject[]> {
    return prisma.subject.findMany({ orderBy: { name: "asc" } });
  },
};
