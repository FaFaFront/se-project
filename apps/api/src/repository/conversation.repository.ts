import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";

const participantSelect = { id: true, name: true, profileUrl: true } as const;

export type ConversationRow = Awaited<
  ReturnType<typeof conversationRepository.findAllForUser>
>[number];

const publicParticipantSelect = {
  id: true,
  name: true,
  role: true,
  profileUrl: true,
} as const satisfies Prisma.UserSelect;

const messageSelect = {
  id: true,
  conversationId: true,
  senderId: true,
  text: true,
  createdAt: true,
  sender: {
    select: publicParticipantSelect,
  },
} as const satisfies Prisma.MessageSelect;

const messageHistorySelect = {
  id: true,
  participantAId: true,
  participantBId: true,
  participantA: { select: publicParticipantSelect },
  participantB: { select: publicParticipantSelect },
  messages: {
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: messageSelect,
  },
} as const satisfies Prisma.ConversationSelect;

export type MessageHistoryRow = Prisma.ConversationGetPayload<{
  select: typeof messageHistorySelect;
}>;
export type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;

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

  async findByIdForParticipant(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      select: { id: true },
    });
  },

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

  async createMessage(conversationId: string, senderId: string, text: string): Promise<MessageRow> {
    return prisma.message.create({
      data: { conversationId, senderId, text },
      select: messageSelect,
    });
  },
};
