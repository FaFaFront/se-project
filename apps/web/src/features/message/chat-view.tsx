"use client";

import type { ChatMessage, ChatParticipant } from "@/types/conversation";
import { Button } from "@/components/ui/button";
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
  composerDisabled?: boolean;
  statusMessage?: string | null;
  onRetry?: () => void;
};

export function ChatView({
  conversationId,
  viewer,
  participant,
  messages,
  onSend,
  isSending,
  sendError,
  composerDisabled = false,
  statusMessage,
  onRetry,
}: ChatViewProps) {
  return (
    <section
      aria-labelledby="chat-heading"
      aria-label={`Conversation ${conversationId}`}
      className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-canvas"
    >
      <ChatHeader
        conversationId={conversationId}
        participant={participant}
        viewerRole={viewer.role}
      />
      <MessageList messages={messages} currentUserId={viewer.id} />
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 border-t border-hairline bg-surface-lavender px-4 py-2 text-sm text-ink sm:px-6"
        >
          <span>{statusMessage}</span>
          {onRetry && (
            <Button type="button" variant="outline" onClick={onRetry} className="shrink-0">
              Retry
            </Button>
          )}
        </div>
      )}
      <MessageComposer
        onSend={onSend}
        isSending={isSending}
        disabled={composerDisabled}
        errorMessage={sendError}
      />
    </section>
  );
}
