import { Button } from "@/components/ui/button";
import type { ChatParticipant } from "@/types/conversation";
import type { UserRole } from "@/types/auth";

type ChatHeaderProps = {
  participant: ChatParticipant;
  viewerRole: UserRole;
  className?: string;
};

function roleLabel(role: UserRole): string {
  return role === "student" ? "Student" : "Tutor";
}

function initials(name: string | null, role: UserRole): string {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return roleLabel(role).slice(0, 1);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

export function ChatHeader({ participant, viewerRole, className }: ChatHeaderProps) {
  const name = participant.name?.trim() || roleLabel(participant.role) || "Unknown user";

  return (
    <header
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-hairline bg-canvas px-4 py-4 sm:px-6 ${className ?? ""}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          {initials(participant.name, participant.role)}
        </div>
        <div className="min-w-0">
          <h1 id="chat-heading" className="truncate text-lg font-semibold text-ink">
            {name}
          </h1>
          <p className="text-sm text-ink/70">{roleLabel(participant.role)}</p>
        </div>
      </div>
      {viewerRole === "tutor" && participant.role === "student" && (
        <Button
          type="button"
          variant="outline"
          className="h-10 px-4 text-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Create Classroom
        </Button>
      )}
    </header>
  );
}
