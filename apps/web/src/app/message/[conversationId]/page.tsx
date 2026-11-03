import type { Metadata } from "next";

import { ChatContainer } from "@/features/message/chat-container";

export const metadata: Metadata = {
  title: "Conversation | Tutorist",
  description: "Chat with your Tutorist conversation partner.",
};

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;

  return <ChatContainer key={conversationId} conversationId={conversationId} />;
}
