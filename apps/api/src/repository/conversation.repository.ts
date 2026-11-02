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
  type: true,
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

const participantsSelect = {
  id: true,
  participantAId: true,
  participantBId: true,
  participantA: { select: { id: true, role: true } },
  participantB: { select: { id: true, role: true } },
} as const satisfies Prisma.ConversationSelect;

export type MessageHistoryRow = Prisma.ConversationGetPayload<{
  select: typeof messageHistorySelect;
}>;
export type MessageRow = Prisma.MessageGetPayload<{ select: typeof messageSelect }>;
export type ConversationParticipantsRow = Prisma.ConversationGetPayload<{
  select: typeof participantsSelect;
}>;

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
          select: { text: true, createdAt: true, senderId: true, type: true },
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

  async findParticipantsForParticipant(
    conversationId: string,
    userId: string
  ): Promise<ConversationParticipantsRow | null> {
    return prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participantAId: userId }, { participantBId: userId }],
      },
      select: participantsSelect,
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
      data: { conversationId, senderId, text, type: "text" },
      select: messageSelect,
    });
  },

  async createSystemMessage(
    tutorId: string,
    studentId: string,
    text: string,
    eventKey?: string,
    tx?: Prisma.TransactionClient
  ): Promise<MessageRow> {
    const write = async (client: Prisma.TransactionClient) => {
      const [a, b] = [tutorId, studentId].sort();
      const pair = JSON.stringify([a, b]);
      // Also serializes reversed callers, without taking wallet row locks.
      await client.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(${pair}, 0))`;
      if (eventKey) {
        const existing = await client.message.findUnique({
          where: { systemEventKey: eventKey },
          select: messageSelect,
        });
        if (existing) return existing;
      }
      const existing = await client.conversation.findFirst({
        where: {
          OR: [
            { participantAId: a, participantBId: b },
            { participantAId: b, participantBId: a },
          ],
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      const conversation =
        existing ??
        (await client.conversation.create({
          data: { participantAId: a, participantBId: b },
          select: { id: true },
        }));
      return client.message.create({
        data: {
          conversationId: conversation.id,
          senderId: null,
          type: "system",
          text,
          systemEventKey: eventKey,
        },
        select: messageSelect,
      });
    };
    return tx ? write(tx) : prisma.$transaction(write);
  },
};
