import { z } from "zod";
import { NotFoundError } from "../../common/errors/app-error.js";
import { conversationService } from "../../service/conversation.service.js";
import type { AppSocket, AppSocketServer, MessageSendAck } from "../socket.types.js";
import { SOCKET_EVENTS } from "../socket.types.js";
import { conversationRoomName } from "../utils/conversation-room.js";
import { createSocketAckFailure } from "../utils/socket-error.js";

const messageSendSchema = z
  .object({
    conversationId: z.string().uuid(),
    text: z.string().trim().min(1).max(2000),
  })
  .strict();

export function registerMessageHandlers(
  io: AppSocketServer,
  socket: AppSocket,
  canBroadcast: () => boolean
): void {
  socket.on(SOCKET_EVENTS.messageSend, async (payload, acknowledge) => {
    const respond = typeof acknowledge === "function" ? acknowledge : undefined;

    try {
      const { conversationId, text } = messageSendSchema.parse(payload);
      const roomName = conversationRoomName(conversationId);
      if (!socket.rooms.has(roomName)) {
        respond?.(
          createSocketAckFailure(
            "NOT_IN_CONVERSATION_ROOM",
            "Join this conversation before sending a message"
          )
        );
        return;
      }

      if (!canBroadcast()) {
        respond?.(
          createSocketAckFailure(
            "INTERNAL_ERROR",
            "Chat is temporarily unavailable. Please try again shortly."
          )
        );
        return;
      }

      const message = await conversationService.sendMessage(
        conversationId,
        socket.data.user.id,
        text
      );
      // Fanout is best-effort: the Redis adapter does not await PUBLISH. The
      // success ACK confirms database persistence, not delivery to every socket.
      try {
        io.to(roomName).emit(SOCKET_EVENTS.messageNew, { message });
      } catch {
        console.error("Message broadcast failed after persistence");
      }
      respond?.({ success: true, data: { message, delivery: "persisted" } });
    } catch (error) {
      respond?.(mapMessageError(error));
    }
  });
}

function mapMessageError(error: unknown): MessageSendAck {
  if (error instanceof z.ZodError) {
    return createSocketAckFailure("INVALID_MESSAGE", "Enter a message of up to 2000 characters");
  }
  if (error instanceof NotFoundError) {
    return createSocketAckFailure("CONVERSATION_NOT_FOUND", "Conversation not found");
  }

  console.error("Message send failed");
  return createSocketAckFailure("INTERNAL_ERROR", "Unable to send message");
}
