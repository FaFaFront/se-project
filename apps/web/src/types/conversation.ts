import type { UserRole } from "@/types/auth";

export type ConversationParticipant = {
  id: string;
  name: string | null;
  profileUrl: string | null;
};

export type ConversationLastMessage = {
  text: string;
  createdAt: string;
  senderId: string | null;
  type: "text" | "system";
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

type MessageBase = {
  id: string;
  conversationId: string;
  text: string;
  createdAt: string;
};

export type TextChatMessage = MessageBase & {
  type: "text";
  senderId: string;
  sender: ChatParticipant;
};

export type SystemChatMessage = MessageBase & {
  type: "system";
  senderId: null;
  sender: null;
};

export type ChatMessage = TextChatMessage | SystemChatMessage;

export type MessageHistory = {
  conversationId: string;
  participant: ChatParticipant;
  messages: ChatMessage[];
};
