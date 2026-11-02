import type { Prisma } from "@prisma/client";
import { conversationRepository } from "../repository/conversation.repository.js";
import { serializeMessage } from "../common/utils/message-presenter.js";

/** Server-only: never accept system-message fields from user HTTP/socket payloads. */
export async function sendSystemMessage(
  tutorId: string,
  studentId: string,
  text: string,
  options: { eventKey?: string; tx?: Prisma.TransactionClient } = {}
) {
  return serializeMessage(
    await conversationRepository.createSystemMessage(
      tutorId,
      studentId,
      text,
      options.eventKey,
      options.tx
    )
  );
}
