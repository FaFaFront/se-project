import { NotFoundError } from "../common/errors/app-error.js";
import { conversationRepository } from "../repository/conversation.repository.js";

export const conversationService = {
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
      messages: conversation.messages.map((message) => ({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        sender: message.sender,
      })),
    };
  },
};
