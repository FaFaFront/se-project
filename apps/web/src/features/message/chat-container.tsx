"use client";

import { useAuth } from "@/contexts/auth-context";
import type { ChatParticipant } from "@/types/conversation";
import { ChatView } from "./chat-view";
import { ChatViewError, ChatViewLoading } from "./chat-view-state";
import { useConversationChat } from "./hooks/use-conversation-chat";

type ChatContainerProps = { conversationId: string };

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const { profile } = useAuth();
  const { participant, messages, isLoading, isConnected, error, sendMessage, retry } =
    useConversationChat(conversationId, Boolean(profile));

  if (!profile || (isLoading && !participant)) return <ChatViewLoading />;
  if (!participant) {
    return <ChatViewError message={error ?? "Unable to load this conversation."} onRetry={retry} />;
  }

  const viewer: ChatParticipant = {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    profileUrl: profile.profileUrl,
  };

  return (
    <ChatView
      conversationId={conversationId}
      viewer={viewer}
      participant={participant}
      messages={messages}
      onSend={sendMessage}
      composerDisabled={!isConnected}
      statusMessage={error ?? (!isConnected ? "Connecting to chat..." : null)}
      onRetry={error ? retry : undefined}
    />
  );
}
