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
