import Link from "next/link";

import { ProfileAvatar } from "@/features/profile/profile-avatar";
import type { Conversation } from "@/types/conversation";

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ConversationCard({ conversation }: { conversation: Conversation }) {
  const { otherParticipant, lastMessage } = conversation;

  return (
    <Link
      href={`/message/${conversation.id}`}
      className="flex items-center gap-4 rounded-[10px] border border-hairline bg-canvas px-4 py-4 shadow-sm transition-colors hover:bg-surface-lavender"
    >
      <ProfileAvatar src={otherParticipant.profileUrl} name={otherParticipant.name} size={44} />
      <div className="min-w-0 flex-1">
        <p className="text-ink-black truncate text-sm font-semibold">
          {otherParticipant.name ?? "Unknown"}
        </p>
        <p className="text-ink/60 truncate text-xs">{lastMessage?.text ?? "No messages yet"}</p>
      </div>
      {lastMessage && (
        <span className="text-ink/40 shrink-0 text-xs">{relativeTime(lastMessage.createdAt)}</span>
      )}
    </Link>
  );
}
