import type { Subject } from "@prisma/client";
import { subjectRepository } from "../repository/subject.repository.js";

export const subjectService = {
  async getAllSubjects(): Promise<Subject[]> {
    return subjectRepository.findAll();
  },
};
