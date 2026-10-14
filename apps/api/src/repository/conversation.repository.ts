import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

const messageHistorySelect = {
  id: true,
  messages: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      text: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
          role: true,
          profileUrl: true,
        },
      },
    },
  },
} as const satisfies Prisma.ConversationSelect;

export type MessageHistoryRow = Prisma.ConversationGetPayload<{
  select: typeof messageHistorySelect;
}>;

export const conversationRepository = {
  async findMessageHistoryForParticipant(
    conversationId: string,
    userId: string
  ): Promise<MessageHistoryRow | null> {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      select: messageHistorySelect,
    });
  },
};
