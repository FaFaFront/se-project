import { ClassroomStatus, Role } from "@prisma/client";
import { ConflictError, ForbiddenError, NotFoundError } from "../common/errors/app-error.js";
import { classroomRepository } from "../repository/classroom.repository.js";

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
