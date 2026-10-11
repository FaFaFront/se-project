import { prisma } from "../config/prisma.js";

const participantSelect = { id: true, name: true, profileUrl: true } as const;

export type ConversationRow = Awaited<
  ReturnType<typeof conversationRepository.findAllForUser>
>[number];

export const conversationRepository = {
  async findAllForUser(userId: string) {
    return prisma.conversation.findMany({
      where: { OR: [{ participantAId: userId }, { participantBId: userId }] },
      include: {
        participantA: { select: participantSelect },
        participantB: { select: participantSelect },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { text: true, createdAt: true, senderId: true },
        },
      },
    });
  },
};
