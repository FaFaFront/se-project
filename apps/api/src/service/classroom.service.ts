import type { ClassroomStatus } from "@prisma/client";
import {
  classroomRepository,
  type ClassroomListFilter,
} from "../repository/classroom.repository.js";

export type ClassroomListItem = {
  id: string;
  student: { id: string; name: string | null; profileUrl: string | null };
  subject: { id: string; name: string };
  pricePerHour: number;
  status: ClassroomStatus;
  createdAt: string;
};

export const classroomService = {
  async listTutorClassrooms(
    tutorId: string,
    filter: ClassroomListFilter
  ): Promise<ClassroomListItem[]> {
    const classrooms = await classroomRepository.findByTutor(tutorId, filter);

    return classrooms.map((classroom) => ({
      id: classroom.id,
      student: classroom.student,
      subject: classroom.subject,
      pricePerHour: Number(classroom.pricePerHour),
      status: classroom.status,
      createdAt: classroom.createdAt.toISOString(),
    }));
  },
};
