import { ForbiddenError, NotFoundError } from "../common/errors/app-error.js";
import { classroomRepository } from "../repository/classroom.repository.js";

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
        createdAt: classroom.createdAt,
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
