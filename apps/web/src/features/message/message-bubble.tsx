import type { ChatMessage } from "@/types/conversation";

type MessageBubbleProps = {
  message: ChatMessage;
  isOwnMessage: boolean;
};

function getRoleFallback(role: ChatMessage["sender"]["role"]): string {
  if (role === "student") return "Student";
  if (role === "tutor") return "Tutor";
  return "Unknown user";
}

function formatMessageTime(value: string): { visible: string; accessible: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { visible: "Time unavailable", accessible: "Invalid message timestamp" };
  }

  return {
    visible: new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(date),
    accessible: date.toLocaleString(),
  };
}

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const senderName = message.sender.name?.trim() || getRoleFallback(message.sender.role);
  const time = formatMessageTime(message.createdAt);

  return (
    <li className={`flex w-full ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      <article
        className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] lg:max-w-[65%] ${
          isOwnMessage ? "bg-primary text-white" : "bg-surface-lavender text-ink"
        }`}
      >
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm font-semibold">{isOwnMessage ? "You" : senderName}</p>
          <time
            dateTime={message.createdAt}
            title={time.accessible}
            aria-label={time.accessible}
            className={`text-xs ${isOwnMessage ? "text-white/80" : "text-ink/70"}`}
          >
            {time.visible}
          </time>
        </div>
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.text}</p>
      </article>
    </li>
  );
}
