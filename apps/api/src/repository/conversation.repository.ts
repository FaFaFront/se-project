import { prisma } from "../config/prisma.js";

const participantSelect = {
  id: true,
  name: true,
  role: true,
  profileUrl: true,
} as const;

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  text: true,
  createdAt: true,
  sender: { select: participantSelect },
} as const;

export const conversationRepository = {
  findParticipant(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      select: { id: true },
    });
  },

  findMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: messageSelect,
    });
  },

  createMessage(conversationId: string, senderId: string, text: string) {
    return prisma.message.create({
      data: { conversationId, senderId, text },
      select: messageSelect,
    });
  },
};
