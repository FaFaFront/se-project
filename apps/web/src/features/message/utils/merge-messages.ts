import type { ChatMessage } from "@/types/conversation";

export function mergeMessages(
  current: readonly ChatMessage[],
  incoming: ChatMessage | readonly ChatMessage[]
): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of current) byId.set(message.id, message);
  for (const message of Array.isArray(incoming) ? incoming : [incoming]) {
    byId.set(message.id, message);
  }
  return [...byId.values()].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
  );
}
