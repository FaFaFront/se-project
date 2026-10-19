"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/conversation";
import { MessageBubble } from "./message-bubble";

type MessageListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  className?: string;
};

export function MessageList({ messages, currentUserId, className }: MessageListProps) {
  const bottomSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomSentinelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <div
      role="log"
      aria-label="Conversation messages"
      aria-live="polite"
      aria-relevant="additions"
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 ${className ?? ""}`}
    >
      {messages.length === 0 ? (
        <p className="flex h-full min-h-40 items-center justify-center text-center text-sm text-ink/70">
          No messages yet. Start the conversation with a friendly hello.
        </p>
      ) : (
        <ol aria-label="Messages" className="flex flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.senderId === currentUserId}
            />
          ))}
        </ol>
      )}
      <div ref={bottomSentinelRef} aria-hidden="true" />
    </div>
  );
}
