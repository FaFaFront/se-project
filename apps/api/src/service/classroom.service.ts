import { ClassroomStatus, Prisma, Role } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/errors/app-error.js";
import {
  classroomRepository,
  type ClassroomDetailRow,
  type ClassroomListFilter,
} from "../repository/classroom.repository.js";
import { conversationRepository } from "../repository/conversation.repository.js";
import { tutorRepository } from "../repository/tutor.repository.js";

export type ClassroomListItem = {
  id: string;
  student: { id: string; name: string | null; profileUrl: string | null };
  subject: { id: string; name: string };
  pricePerHour: number;
  status: ClassroomStatus;
  createdAt: string;
};

type CreateClassroomInput = {
  conversationId: string;
  subjectId: string;
  pricePerHour?: number;
};

type UpdateClassroomInput = {
  subjectId: string;
  pricePerHour: number;
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

// Another tutor's classroom is reported as missing, like GET /:classroomId, so its existence isn't leaked.
async function requireAssignedClassroom(classroomId: string, tutorId: string) {
  const classroom = await classroomRepository.findById(classroomId);
  if (!classroom || classroom.tutorId !== tutorId) {
    throw new NotFoundError("Classroom not found");
  }
  return classroom;
}

function mapTutorClassroomDetail(classroom: ClassroomDetailRow) {
  return {
    id: classroom.id,
    subject: classroom.subject,
    pricePerHour: Number(classroom.pricePerHour),
    status: classroom.status,
    viewerRole: "tutor" as const,
    participant: mapParticipant(classroom.student),
    createdAt: classroom.createdAt.toISOString(),
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

  async createClassroom(tutorId: string, input: CreateClassroomInput) {
    const conversation = await conversationRepository.findParticipantsForParticipant(
      input.conversationId,
      tutorId
    );
    if (!conversation) throw new NotFoundError("Conversation not found");

    const otherParticipant =
      conversation.participantAId === tutorId
        ? conversation.participantB
        : conversation.participantA;
    if (otherParticipant.role !== Role.student) {
      throw new BadRequestError("The other participant in this conversation is not a student");
    }
    const studentId = otherParticipant.id;

    const tutorSubject = await tutorRepository.findSubjectAssignment(tutorId, input.subjectId);
    if (!tutorSubject) {
      throw new BadRequestError("Selected subject is not assigned to this tutor");
    }

    let pricePerHour: Prisma.Decimal;
    if (input.pricePerHour !== undefined) {
      pricePerHour = new Prisma.Decimal(input.pricePerHour);
    } else {
      const tutor = await tutorRepository.findHourlyRate(tutorId);
      if (!tutor?.hourlyRate || tutor.hourlyRate.lte(0)) {
        throw new BadRequestError(
          "No price was provided and this tutor has no default hourly rate"
        );
      }
      pricePerHour = tutor.hourlyRate;
    }

    const classroom = await classroomRepository.create({
      tutorId,
      studentId,
      subjectId: input.subjectId,
      pricePerHour,
    });

    return {
      id: classroom.id,
      tutorId: classroom.tutorId,
      studentId: classroom.studentId,
      subjectId: classroom.subjectId,
      pricePerHour: Number(classroom.pricePerHour),
      status: classroom.status,
      createdAt: classroom.createdAt.toISOString(),
    };
  },

  async getClassroomDetail(classroomId: string, viewerId: string) {
    const classroom = await classroomRepository.findDetailById(classroomId);

    if (!classroom) {
      throw new NotFoundError("Classroom not found");
    }

    if (classroom.tutorId === viewerId) {
      return mapTutorClassroomDetail(classroom);
    }

    if (classroom.studentId === viewerId) {
      return {
        id: classroom.id,
        subject: classroom.subject,
        pricePerHour: Number(classroom.pricePerHour),
        status: classroom.status,
        viewerRole: "student" as const,
        participant: mapParticipant(classroom.tutor),
      };
    }

    // Same 404 as a missing classroom so non-participants can't probe which IDs exist.
    throw new NotFoundError("Classroom not found");
  },

  /** Changes only the subject and this classroom's price; the tutor's default rate is untouched. */
  async updateClassroom(classroomId: string, tutorId: string, input: UpdateClassroomInput) {
    const classroom = await requireAssignedClassroom(classroomId, tutorId);
    if (classroom.status !== ClassroomStatus.active) {
      throw new ConflictError("Completed classrooms cannot be edited");
    }

    const tutorSubject = await tutorRepository.findSubjectAssignment(tutorId, input.subjectId);
    if (!tutorSubject) {
      throw new BadRequestError("Selected subject is not assigned to this tutor");
    }

    const { count } = await classroomRepository.updateActiveDetails(classroomId, tutorId, {
      subjectId: input.subjectId,
      pricePerHour: new Prisma.Decimal(input.pricePerHour),
    });
    if (count === 0) {
      // Deactivated between the check above and the update.
      throw new ConflictError("Classroom changed during the update. Please reload and try again");
    }

    const updated = await classroomRepository.findDetailById(classroomId);
    if (!updated) {
      throw new NotFoundError("Classroom not found");
    }
    return mapTutorClassroomDetail(updated);
  },

  async deactivate(classroomId: string, userId: string, role: string) {
    if (role !== Role.tutor) {
      throw new ForbiddenError("Only tutors can deactivate classrooms");
    }

    const classroom = await requireAssignedClassroom(classroomId, userId);
    if (classroom.status !== ClassroomStatus.completed) {
      const { count } = await classroomRepository.completeActive(classroomId, userId);
      if (count === 0) {
        const current = await requireAssignedClassroom(classroomId, userId);
        if (current.status !== ClassroomStatus.completed) {
          throw new ConflictError("Classroom changed during deactivation. Please try again");
        }
      }
    }

    return { id: classroom.id, status: ClassroomStatus.completed };
  },
};
