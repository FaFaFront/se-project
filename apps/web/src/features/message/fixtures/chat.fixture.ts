import type { ChatMessage, ChatParticipant } from "@/types/conversation";

export const MOCK_CONVERSATION_ID = "33333333-3333-4333-8333-333333333333";

export const mockStudentParticipant: ChatParticipant = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Alex Morgan",
  role: "student",
  profileUrl: null,
};

export const mockTutorParticipant: ChatParticipant = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Jamie Rivera",
  role: "tutor",
  profileUrl: null,
};

export function createMockMessages(conversationId: string): ChatMessage[] {
  return [
    {
      id: "44444444-4444-4444-8444-444444444444",
      conversationId,
      senderId: mockStudentParticipant.id,
      text: "Hi Jamie! I would like to review quadratic equations before my exam.",
      createdAt: "2026-10-14T08:30:00.000Z",
      sender: { ...mockStudentParticipant },
    },
    {
      id: "55555555-5555-4555-8555-555555555555",
      conversationId,
      senderId: mockTutorParticipant.id,
      text: "Absolutely. We can work through a few examples and build up to the harder problems.",
      createdAt: "2026-10-14T08:31:00.000Z",
      sender: { ...mockTutorParticipant },
    },
    {
      id: "66666666-6666-4666-8666-666666666666",
      conversationId,
      senderId: mockStudentParticipant.id,
      text: "That sounds great. Tomorrow afternoon works well for me.",
      createdAt: "2026-10-14T08:32:00.000Z",
      sender: { ...mockStudentParticipant },
    },
  ];
}

export function getMockParticipantForViewer(
  viewer: Pick<ChatParticipant, "id" | "role">
): ChatParticipant {
  if (viewer.id === mockStudentParticipant.id) {
    return { ...mockTutorParticipant };
  }
  if (viewer.id === mockTutorParticipant.id) {
    return { ...mockStudentParticipant };
  }

  return viewer.role === "student" ? { ...mockTutorParticipant } : { ...mockStudentParticipant };
}
