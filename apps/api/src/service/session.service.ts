import { ClassroomStatus, MeetSessionStatus, Prisma } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/errors/app-error.js";
import { createMeetSpace } from "../common/google/meet.client.js";
import { classroomRepository } from "../repository/classroom.repository.js";
import { sessionRepository, type SessionRow } from "../repository/session.repository.js";

export type SessionItem = {
  id: string;
  classroomId: string;
  scheduledAt: string;
  durationHours: number;
  status: string;
  meetLink: string;
  meetSpaceName: string | null;
};

function serializeSession(session: SessionRow): SessionItem {
  return {
    id: session.id,
    classroomId: session.classroomId,
    scheduledAt: session.scheduledAt.toISOString(),
    durationHours: Number(session.durationHours),
    status: session.status,
    meetLink: session.meetLink,
    meetSpaceName: session.meetSpaceName,
  };
}

export const sessionService = {
  async createSession(
    classroomId: string,
    tutorId: string,
    input: { scheduledAt: string; durationHours: number }
  ): Promise<SessionItem> {
    const classroom = await classroomRepository.findById(classroomId);
    if (!classroom || classroom.tutorId !== tutorId) {
      throw new NotFoundError("Classroom not found");
    }
    if (classroom.status !== ClassroomStatus.active) {
      throw new BadRequestError("Sessions can only be scheduled in an active classroom");
    }

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt < new Date(Date.now() + 30 * 60 * 1000)) {
      throw new BadRequestError("Session must be scheduled at least 30 minutes in the future");
    }

    const { durationHours } = input;
    if (durationHours < 0.5 || durationHours > 4 || !Number.isInteger(durationHours * 2)) {
      throw new BadRequestError("Duration must be between 0.5 and 4 hours in 0.5-hour steps");
    }

    const endAt = new Date(scheduledAt.getTime() + durationHours * 3600 * 1000);
    const overlaps = await sessionRepository.hasOverlap(
      classroom.tutorId,
      classroom.studentId,
      scheduledAt,
      endAt
    );
    if (overlaps) {
      throw new ConflictError(
        "This time slot overlaps an existing session for the tutor or student"
      );
    }

    const { spaceName, meetingUri } = await createMeetSpace();

    const session = await sessionRepository.create({
      classroomId,
      scheduledAt,
      durationHours: new Prisma.Decimal(durationHours),
      meetLink: meetingUri,
      meetSpaceName: spaceName,
    });

    return serializeSession(session);
  },

  async cancelSession(sessionId: string, tutorId: string): Promise<SessionItem> {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw new NotFoundError("Session not found");

    if (session.classroom.tutorId !== tutorId) {
      throw new ForbiddenError("Only the classroom tutor can cancel sessions");
    }

    if (
      session.status !== MeetSessionStatus.scheduled &&
      session.status !== MeetSessionStatus.ongoing
    ) {
      throw new BadRequestError("Only scheduled or ongoing sessions can be cancelled");
    }

    const updated = await sessionRepository.cancel(sessionId);
    return serializeSession(updated);
  },
};
