"use client";

import type { ChatMessage, ChatParticipant } from "@/types/conversation";
import { ChatHeader } from "./chat-header";
import { MessageComposer } from "./message-composer";
import { MessageList } from "./message-list";

type ChatViewProps = {
  conversationId: string;
  viewer: ChatParticipant;
  participant: ChatParticipant;
  messages: ChatMessage[];
  onSend: (text: string) => void | Promise<void>;
  isSending?: boolean;
  sendError?: string | null;
};

export function ChatView({
  conversationId,
  viewer,
  participant,
  messages,
  onSend,
  isSending,
  sendError,
}: ChatViewProps) {
  return (
    <section
      aria-labelledby="chat-heading"
      aria-label={`Conversation ${conversationId}`}
      className="flex h-[min(72vh,760px)] min-h-[420px] max-h-[760px] min-w-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-canvas shadow-sm"
    >
      <ChatHeader participant={participant} viewerRole={viewer.role} />
      <MessageList messages={messages} currentUserId={viewer.id} />
      <MessageComposer onSend={onSend} isSending={isSending} errorMessage={sendError} />
    </section>
  );
}
