import type { ChatMessage } from "@/types/conversation";

export function createSystemMessageRefresh(refresh: () => Promise<void>) {
  const seen = new Set<string>();
  return async (messages: ChatMessage[], source: "live" | "history" = "live") => {
    const unseen = messages.filter((message) => message.type === "system" && !seen.has(message.id));
    // AuthProvider resolves even on a transient API failure. Always revalidate after
    // history recovery, including notices whose earlier live refresh may have failed.
    if (source !== "history" && unseen.length === 0) return;
    for (const message of unseen) seen.add(message.id);
    await refresh();
  };
}
