export const CONVERSATION_ROOM_PREFIX = "conversation:";

export function conversationRoomName(conversationId: string): string {
  return `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
}

export function isConversationRoom(roomName: string): boolean {
  return roomName.startsWith(CONVERSATION_ROOM_PREFIX);
}
