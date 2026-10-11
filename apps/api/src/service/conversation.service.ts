import { conversationRepository } from "../repository/conversation.repository.js";

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
};
