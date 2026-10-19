import type { ClassroomStatus } from "@prisma/client";
import { ForbiddenError, NotFoundError } from "../common/errors/app-error.js";
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

function mapParticipant(participant: {
  id: string;
  name: string | null;
  profileUrl: string | null;
}) {
  return {
    id: participant.id,
    name: participant.name,
    profileUrl: participant.profileUrl,
  };
}

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

  async getClassroomDetail(classroomId: string, viewerId: string) {
    const classroom = await classroomRepository.findDetailById(classroomId);

    if (!classroom) {
      throw new NotFoundError("Classroom not found");
    }

    const commonDetail = {
      id: classroom.id,
      subject: classroom.subject,
      pricePerHour: Number(classroom.pricePerHour),
      status: classroom.status,
    };

    if (classroom.tutorId === viewerId) {
      return {
        ...commonDetail,
        viewerRole: "tutor" as const,
        participant: mapParticipant(classroom.student),
        createdAt: classroom.createdAt.toISOString(),
      };
    }

    if (classroom.studentId === viewerId) {
      return {
        ...commonDetail,
        viewerRole: "student" as const,
        participant: mapParticipant(classroom.tutor),
      };
    }

    throw new ForbiddenError("You do not have access to this classroom");
  },
};
