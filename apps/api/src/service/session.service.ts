import { transactionRepository } from "../repository/transaction.repository.js";
import { conversationService, type SerializedMessage } from "./conversation.service.js";
import { ClassroomStatus, MeetSessionStatus } from "@prisma/client";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../common/errors/app-error.js";
import { randomUUID } from "node:crypto";
import { classroomRepository } from "../repository/classroom.repository.js";
import { sessionRepository } from "../repository/session.repository.js";
import {
  getSessionDurationMinutes,
  scheduledEnd,
  serializeSession,
  SESSION_DURATION_ERROR,
} from "../common/utils/session.js";

export type SessionItem = ReturnType<typeof serializeSession>;

export const sessionService = {
  async getSession(sessionId: string, userId: string): Promise<SessionItem> {
    const session = await sessionRepository.findById(sessionId);
    if (
      !session ||
      (session.classroom.tutorId !== userId && session.classroom.studentId !== userId)
    )
      throw new NotFoundError("Session not found");
    return serializeSession(session);
  },

  async recordAttendance(sessionId: string, userId: string): Promise<SessionItem> {
    return serializeSession(await sessionRepository.recordAttendance(sessionId, userId));
  },
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
    if (scheduledAt.getTime() < Date.now() + 60_000) {
      throw new BadRequestError("Session must be scheduled at least 1 minute in the future");
    }

    const durationMinutes = getSessionDurationMinutes(input.durationHours);
    if (durationMinutes === undefined) {
      throw new BadRequestError(SESSION_DURATION_ERROR);
    }

    const endAt = scheduledEnd({ scheduledAt, durationMinutes });
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

    const meetingUri = `https://meet.jit.si/se-${randomUUID()}`;
    const spaceName = null;

    const session = await sessionRepository.create({
      classroomId,
      scheduledAt,
      durationMinutes,
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

    const updated = await sessionRepository.cancel(sessionId, tutorId);
    return serializeSession(updated);
  },
};

export async function runSessionSettlementTick(
  broadcast: (message: SerializedMessage) => void,
  now = new Date()
): Promise<void> {
  try {
    await sessionRepository.advanceScheduled(now);
    for (const { id } of await sessionRepository.findDueForSettlement(now)) {
      try {
        const outcome = await transactionRepository.settleSession(id, now);
        console.info("Session settlement", { sessionId: id, outcome: outcome.kind });
      } catch (error) {
        console.error("Session settlement failed; will retry", { sessionId: id, error });
      }
    }
  } catch (error) {
    console.error("Unable to find due sessions; will retry", error);
  }

  // Independent pass: a failed payment must not block committed payment notices.
  for (const { id } of await sessionRepository.findPendingSettlementNotices()) {
    try {
      const message = await conversationService.sendSettlementNotice(id);
      if (message) {
        try {
          broadcast(message);
        } catch (error) {
          console.error(
            "Settlement notice broadcast failed after persistence; available in chat history",
            { sessionId: id, error }
          );
        }
      }
    } catch (error) {
      console.error("Settlement notice failed; will retry persistence on next tick", {
        sessionId: id,
        error,
      });
    }
  }
}
