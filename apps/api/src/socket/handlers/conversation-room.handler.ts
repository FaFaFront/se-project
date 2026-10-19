import { NotFoundError } from "../../common/errors/app-error.js";
import { conversationService } from "../../service/conversation.service.js";
import type { AppSocket, ConversationRoomAck } from "../socket.types.js";
import { SOCKET_EVENTS } from "../socket.types.js";
import { conversationRoomName, isConversationRoom } from "../utils/conversation-room.js";
import { createSocketAckFailure } from "../utils/socket-error.js";
import { z } from "zod";

const conversationRoomPayloadSchema = z
  .object({
    conversationId: z.string().uuid("Conversation ID must be a valid UUID"),
  })
  .strict();

export function registerConversationRoomHandlers(socket: AppSocket): void {
  socket.on(SOCKET_EVENTS.conversationJoin, async (payload, acknowledge) => {
    const respond = getAcknowledge(acknowledge);

    try {
      const { conversationId } = conversationRoomPayloadSchema.parse(payload);
      const authorizedConversationId = await conversationService.requireParticipant(
        conversationId,
        socket.data.user.id
      );

      for (const room of socket.rooms) {
        if (isConversationRoom(room)) {
          await socket.leave(room);
        }
      }

      await socket.join(conversationRoomName(authorizedConversationId));
      respond?.({ success: true, data: { conversationId: authorizedConversationId } });
    } catch (error) {
      respond?.(mapRoomError(error, "Unable to join conversation"));
    }
  });

  socket.on(SOCKET_EVENTS.conversationLeave, async (payload, acknowledge) => {
    const respond = getAcknowledge(acknowledge);

    try {
      const { conversationId } = conversationRoomPayloadSchema.parse(payload);
      await socket.leave(conversationRoomName(conversationId));
      respond?.({ success: true, data: { conversationId } });
    } catch (error) {
      respond?.(mapRoomError(error, "Unable to leave conversation"));
    }
  });
}

function getAcknowledge(
  acknowledge: ((response: ConversationRoomAck) => void) | undefined
): ((response: ConversationRoomAck) => void) | undefined {
  return typeof acknowledge === "function" ? acknowledge : undefined;
}

function mapRoomError(error: unknown, internalMessage: string): ConversationRoomAck {
  if (error instanceof z.ZodError) {
    return createSocketAckFailure(
      "INVALID_CONVERSATION_ID",
      "Conversation ID must be a valid UUID"
    );
  }
  if (error instanceof NotFoundError) {
    return createSocketAckFailure("CONVERSATION_NOT_FOUND", "Conversation not found");
  }

  console.error("Conversation room operation failed");
  return createSocketAckFailure("INTERNAL_ERROR", internalMessage);
}
