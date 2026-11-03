import { NotFoundError } from "../common/errors/app-error.js";
import { conversationRepository, type MessageRow } from "../repository/conversation.repository.js";
import type { Prisma } from "@prisma/client";

export function serializeMessage(message: MessageRow) {
  const base = {
    id: message.id,
    conversationId: message.conversationId,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
  if (message.type === "system")
    return { ...base, type: "system" as const, senderId: null, sender: null };
  if (!message.sender || !message.senderId) throw new Error("Text message is missing its sender");
  return { ...base, type: "text" as const, senderId: message.senderId, sender: message.sender };
}

export type SerializedMessage = ReturnType<typeof serializeMessage>;

export const conversationService = {
  async sendSystemMessage(
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
  },
  async sendSettlementNotice(sessionId: string) {
    const message = await conversationRepository.createSettlementNotice(sessionId);
    return message ? serializeMessage(message) : null;
  },
  async listForUser(userId: string) {
    const rows = await conversationRepository.findAllForUser(userId);

    const summaries = rows.map((row) => {
      const otherParticipant = row.participantA.id === userId ? row.participantB : row.participantA;
      const lastMsg = row.messages[0] ?? null;
      return {
        id: row.id,
        otherParticipant,
        lastMessage: lastMsg
          ? {
              text: lastMsg.text,
              createdAt: lastMsg.createdAt.toISOString(),
              senderId: lastMsg.senderId,
              type: lastMsg.type,
            }
          : null,
        createdAt: row.createdAt.toISOString(),
      };
    });

    // shortcut: app-side sort; fine for expected inbox sizes, use DB orderBy if list grows large
    return summaries.sort((a, b) => {
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
      );
    });
  },

  async requireParticipant(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findByIdForParticipant(
      conversationId,
      userId
    );

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    return conversation.id;
  },

  async getMessageHistory(conversationId: string, userId: string) {
    const conversation = await conversationRepository.findMessageHistoryForParticipant(
      conversationId,
      userId
    );

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    return {
      conversationId: conversation.id,
      participant:
        conversation.participantAId === userId
          ? conversation.participantB
          : conversation.participantA,
      messages: conversation.messages.map(serializeMessage),
    };
  },

  async sendMessage(conversationId: string, senderId: string, text: string) {
    await this.requireParticipant(conversationId, senderId);
    const message = await conversationRepository.createMessage(conversationId, senderId, text);
    return serializeMessage(message);
  },
};
