import { io, type Socket } from "socket.io-client";
import { getToken } from "@/lib/auth-storage";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/chat-socket";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let chatSocket: ChatSocket | null = null;

export function getChatSocket(): ChatSocket {
  if (!chatSocket) {
    chatSocket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket"],
      auth: (callback) => callback({ token: getToken() }),
    }) as ChatSocket;
  }
  return chatSocket;
}

export function connectChatSocket(): ChatSocket {
  const socket = getChatSocket();
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectChatSocket(): void {
  chatSocket?.disconnect();
}
