"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import type { ChatMessage, ChatParticipant } from "@/types/conversation";
import { ChatView } from "./chat-view";
import { ChatViewLoading } from "./chat-view-state";
import { createMockMessages, getMockParticipantForViewer } from "./fixtures/chat.fixture";

type ChatPreviewProps = {
  conversationId: string;
};

export function ChatPreview({ conversationId }: ChatPreviewProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => createMockMessages(conversationId));

  if (!profile) {
    return <ChatViewLoading />;
  }

  const viewer: ChatParticipant = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    profileUrl: profile.profileUrl,
  };
  const participant = getMockParticipantForViewer(viewer);

  // #110 replaces this local preview adapter with API history and socket integration.
  async function handleSend(text: string) {
    const message: ChatMessage = {
      id: `preview-${crypto.randomUUID()}`,
      conversationId,
      senderId: viewer.id,
      text,
      createdAt: new Date().toISOString(),
      sender: { ...viewer },
    };

    setMessages((currentMessages) => [...currentMessages, message]);
  }

  return (
    <ChatView
      conversationId={conversationId}
      viewer={viewer}
      participant={participant}
      messages={messages}
      onSend={handleSend}
    />
  );
}
