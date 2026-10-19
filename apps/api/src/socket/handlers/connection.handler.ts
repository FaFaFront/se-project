import type { AppSocket, AppSocketServer } from "../socket.types.js";
import { registerConversationRoomHandlers } from "./conversation-room.handler.js";
import { registerMessageHandlers } from "./message.handler.js";

export function registerConnectionHandlers(io: AppSocketServer, socket: AppSocket): void {
  registerConversationRoomHandlers(socket);
  registerMessageHandlers(io, socket);
}
