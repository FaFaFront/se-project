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
