import type { UserRole } from "@/types/auth";

export type ConversationParticipant = {
  id: string;
  name: string | null;
  profileUrl: string | null;
};

export type ConversationLastMessage = {
  text: string;
  createdAt: string;
  senderId: string;
};

export type Conversation = {
  id: string;
  otherParticipant: ConversationParticipant;
  lastMessage: ConversationLastMessage | null;
  createdAt: string;
};

export type ChatParticipant = {
  id: string;
  name: string | null;
  role: UserRole;
  profileUrl: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender: ChatParticipant;
};

export type MessageHistory = {
  conversationId: string;
  participant: ChatParticipant;
  messages: ChatMessage[];
};
