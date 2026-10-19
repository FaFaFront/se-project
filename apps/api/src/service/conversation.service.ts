import { NotFoundError } from "../common/errors/app-error.js";
import { conversationRepository, type MessageRow } from "../repository/conversation.repository.js";

function serializeMessage(message: MessageRow) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    sender: message.sender,
  };
}

export const conversationService = {
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
