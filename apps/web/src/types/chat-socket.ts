import type { ChatMessage } from "@/types/conversation";

// Mirrors apps/api/src/socket/socket.types.ts until the apps share a contract package.
export const SOCKET_EVENTS = {
  conversationJoin: "conversation:join",
  conversationLeave: "conversation:leave",
  messageSend: "message:send",
  messageNew: "message:new",
} as const;

export type ConversationRoomPayload = { conversationId: string };
export type SocketAckSuccess<T> = { success: true; data: T };
export type SocketAckFailure<Code extends string = string> = {
  success: false;
  code: Code;
  message: string;
};
export type ConversationRoomErrorCode =
  "INVALID_CONVERSATION_ID" | "CONVERSATION_NOT_FOUND" | "INTERNAL_ERROR";
export type ConversationRoomAck =
  SocketAckSuccess<{ conversationId: string }> | SocketAckFailure<ConversationRoomErrorCode>;
export type MessageSendPayload = { conversationId: string; text: string };
export type MessageNewPayload = { message: ChatMessage };
export type MessageSendErrorCode =
  "INVALID_MESSAGE" | "NOT_IN_CONVERSATION_ROOM" | "CONVERSATION_NOT_FOUND" | "INTERNAL_ERROR";
export type MessageSendAck =
  SocketAckSuccess<MessageNewPayload> | SocketAckFailure<MessageSendErrorCode>;

export type SocketConnectionErrorCode =
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_INVALID"
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_INACTIVE"
  | "INTERNAL_ERROR";
export type SocketConnectionErrorData = { code?: SocketConnectionErrorCode };

export type ClientToServerEvents = {
  [SOCKET_EVENTS.conversationJoin]: (
    payload: ConversationRoomPayload,
    acknowledge?: (response: ConversationRoomAck) => void
  ) => void;
  [SOCKET_EVENTS.conversationLeave]: (
    payload: ConversationRoomPayload,
    acknowledge?: (response: ConversationRoomAck) => void
  ) => void;
  [SOCKET_EVENTS.messageSend]: (
    payload: MessageSendPayload,
    acknowledge?: (response: MessageSendAck) => void
  ) => void;
};

export type ServerToClientEvents = {
  [SOCKET_EVENTS.messageNew]: (payload: MessageNewPayload) => void;
};
