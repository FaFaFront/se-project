import { ForbiddenError, NotFoundError } from "../common/errors/app-error.js";
import { conversationRepository } from "../repository/conversation.repository.js";

async function requireParticipant(conversationId: string, userId: string) {
  const participant = await conversationRepository.findParticipant(conversationId, userId);
  if (!participant) {
    throw new ForbiddenError("You are not a participant in this conversation");
  }
}

export const conversationService = {
  async getMessageHistory(conversationId: string, userId: string) {
    await requireParticipant(conversationId, userId);
    return conversationRepository.findMessages(conversationId);
  },

  async assertParticipant(conversationId: string, userId: string) {
    const participant = await conversationRepository.findParticipant(conversationId, userId);
    if (!participant) {
      throw new NotFoundError("Conversation not found");
    }
  },

  async sendMessage(conversationId: string, senderId: string, text: string) {
    await requireParticipant(conversationId, senderId);
    return conversationRepository.createMessage(conversationId, senderId, text);
  },
};
