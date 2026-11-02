import type { MessageRow } from "../../repository/conversation.repository.js";

export function serializeMessage(message: MessageRow) {
  const base = {
    id: message.id,
    conversationId: message.conversationId,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
  };
  if (message.type === "system")
    return { ...base, type: "system" as const, senderId: null, sender: null };
  if (!message.sender || !message.senderId) throw new Error("Text message is missing its sender");
  return { ...base, type: "text" as const, senderId: message.senderId, sender: message.sender };
}

export type SerializedMessage = ReturnType<typeof serializeMessage>;
