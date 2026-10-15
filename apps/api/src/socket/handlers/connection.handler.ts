import type { AppSocket } from "../socket.types.js";
import { registerConversationRoomHandlers } from "./conversation-room.handler.js";

export function registerConnectionHandlers(socket: AppSocket): void {
  registerConversationRoomHandlers(socket);
}
