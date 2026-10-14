import type { Role } from "@prisma/client";
import type { Server, Socket } from "socket.io";

export const SOCKET_EVENTS = {
  conversationJoin: "conversation:join",
  conversationLeave: "conversation:leave",
} as const;

export type SocketUser = {
  id: string;
  role: Role;
};

export type SocketData = {
  user: SocketUser;
};

export type ConversationRoomPayload = {
  conversationId: string;
};

export type SocketAckSuccess<T> = {
  success: true;
  data: T;
};

export type SocketAckFailure<Code extends string = string> = {
  success: false;
  code: Code;
  message: string;
};

export type ConversationRoomErrorCode =
  "INVALID_CONVERSATION_ID" | "CONVERSATION_NOT_FOUND" | "INTERNAL_ERROR";

export type ConversationRoomAck =
  SocketAckSuccess<{ conversationId: string }> | SocketAckFailure<ConversationRoomErrorCode>;

export type ClientToServerEvents = {
  [SOCKET_EVENTS.conversationJoin]: (
    payload: ConversationRoomPayload,
    acknowledge?: (response: ConversationRoomAck) => void
  ) => void;
  [SOCKET_EVENTS.conversationLeave]: (
    payload: ConversationRoomPayload,
    acknowledge?: (response: ConversationRoomAck) => void
  ) => void;
};

export type ServerToClientEvents = Record<never, never>;
export type InterServerEvents = Record<never, never>;

export type AppSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
