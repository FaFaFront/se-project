import type { UserRole } from "@/types/auth";

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
  messages: ChatMessage[];
};
