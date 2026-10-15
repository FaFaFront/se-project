import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ChatMessage } from "@/types/conversation";
import { ChatView } from "./chat-view";
import { ChatViewError, ChatViewLoading } from "./chat-view-state";
import {
  createMockMessages,
  MOCK_CONVERSATION_ID,
  mockStudentParticipant,
  mockTutorParticipant,
} from "./fixtures/chat.fixture";

const meta = {
  title: "Message/Chat View",
  component: ChatView,
  parameters: {
    layout: "padded",
  },
  args: {
    conversationId: MOCK_CONVERSATION_ID,
    viewer: mockStudentParticipant,
    participant: mockTutorParticipant,
    messages: createMockMessages(MOCK_CONVERSATION_ID),
    onSend: async () => undefined,
  },
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StudentViewingTutor: Story = {};

export const TutorViewingStudent: Story = {
  args: {
    viewer: mockTutorParticipant,
    participant: mockStudentParticipant,
  },
};

export const EmptyConversation: Story = {
  args: {
    messages: [],
  },
};

export const Reconnecting: Story = {
  args: {
    composerDisabled: true,
    statusMessage: "Connection lost. Reconnecting...",
    onRetry: () => {},
  },
};

export const Loading: Story = {
  render: () => <ChatViewLoading />,
};

export const Error: Story = {
  render: () => <ChatViewError message="We couldn't load this conversation." onRetry={() => {}} />,
};

export const LongConversation: Story = {
  args: {
    messages: [
      ...createMockMessages(MOCK_CONVERSATION_ID),
      ...Array.from({ length: 12 }, (_, index): ChatMessage => {
        const sender = index % 2 === 0 ? mockTutorParticipant : mockStudentParticipant;
        return {
          id: `long-preview-${index}`,
          conversationId: MOCK_CONVERSATION_ID,
          senderId: sender.id,
          text:
            index === 5
              ? "Here is a longer explanation to check safe wrapping: " +
                "we can solve the equation by completing the square, then verify each solution in the original expression. ".repeat(
                  4
                )
              : `Practice message ${index + 1}: let's work through one more example together.`,
          createdAt: new Date(Date.UTC(2026, 9, 14, 8, 33 + index)).toISOString(),
          sender: { ...sender },
        };
      }),
    ],
  },
};
