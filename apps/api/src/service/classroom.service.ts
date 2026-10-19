import { ClassroomStatus, Prisma, Role } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/errors/app-error.js";
import { classroomRepository } from "../repository/classroom.repository.js";
import { conversationRepository } from "../repository/conversation.repository.js";
import { tutorRepository } from "../repository/tutor.repository.js";

type CreateClassroomInput = {
  conversationId: string;
  subjectId: string;
  pricePerHour?: number;
};

async function requireAssignedClassroom(classroomId: string, tutorId: string) {
  const classroom = await classroomRepository.findById(classroomId);
  if (!classroom) {
    throw new NotFoundError("Classroom not found");
  }
  if (classroom.tutorId !== tutorId) {
    throw new ForbiddenError("Only the assigned tutor can deactivate this classroom");
  }
  return classroom;
}

export const classroomService = {
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

  async deactivate(classroomId: string, userId: string, role: string) {
    if (role !== Role.tutor) {
      throw new ForbiddenError("Only tutors can deactivate classrooms");
    }

    const classroom = await requireAssignedClassroom(classroomId, userId);
    if (classroom.status !== ClassroomStatus.completed) {
      const { count } = await classroomRepository.completeActive(classroomId, userId);
      if (count === 0) {
        // Another request may have completed it after the initial read.
        // Recheck ownership/existence before accepting that result as success.
        const current = await requireAssignedClassroom(classroomId, userId);
        if (current.status !== ClassroomStatus.completed) {
          throw new ConflictError("Classroom changed during deactivation. Please try again");
        }
      }
    }

    return { id: classroom.id, status: ClassroomStatus.completed };
  },
};
