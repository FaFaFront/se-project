import { BadRequestError, NotFoundError } from "../common/errors/app-error.js";
import { conversationRepository } from "../repository/conversation.repository.js";
import { serializeMessage } from "../common/utils/message.js";
import { userRepository } from "../repository/user.repository.js";
import type { Prisma } from "@prisma/client";

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

  /** Finds the caller's conversation with `otherUserId`, or creates one. */
  async getOrCreateConversation(currentUserId: string, otherUserId: string) {
    if (currentUserId === otherUserId) {
      throw new BadRequestError("Cannot start a conversation with yourself");
    }
    const otherUser = await userRepository.findProfileOwnerById(otherUserId);
    if (!otherUser) throw new NotFoundError("User not found");

    const conversation = await conversationRepository.findOrCreateForUsers(
      currentUserId,
      otherUserId
    );
    return { id: conversation.id };
  },
};
