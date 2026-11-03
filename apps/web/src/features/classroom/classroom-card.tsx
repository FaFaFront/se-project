import Link from "next/link";
import { BookOpen, CalendarDays } from "lucide-react";

import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { formatCurrency } from "@/features/profile/profile-details";
import { cn } from "@/lib/utils";
import { CLASSROOM_STATUS_LABEL, type ClassroomListItem } from "@/types/classroom";

/** A participant may not have set a name yet; never fall back to their email. */
const UNNAMED_PARTICIPANT = "Unnamed user";

function formatCreatedDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function ClassroomCard({ classroom }: { classroom: ClassroomListItem }) {
  const participantName = classroom.participant.name ?? UNNAMED_PARTICIPANT;
  const isActive = classroom.status === "active";

  return (
    <li>
      <Link
        href={`/classroom/${classroom.id}`}
        className="border-hairline bg-canvas gap-base hover:border-primary focus-visible:border-primary flex h-full flex-col rounded-[10px] border p-5 shadow-sm outline-none transition-colors"
      >
        <div className="gap-base flex items-center">
          <ProfileAvatar src={classroom.participant.profileUrl} name={participantName} size={48} />
          <div className="min-w-0 flex-1">
            <h2
              className={cn(
                "text-body-emphasis truncate",
                classroom.participant.name ? "text-ink-black" : "text-placeholder"
              )}
            >
              {participantName}
            </h2>
            <p className="text-ink gap-xs flex items-center text-sm">
              <BookOpen aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{classroom.subject.name}</span>
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold",
              isActive ? "bg-primary/10 text-primary" : "bg-surface-disabled text-ink"
            )}
          >
            {CLASSROOM_STATUS_LABEL[classroom.status]}
          </span>
        </div>

        <div className="border-hairline gap-base text-ink mt-auto flex flex-wrap items-center justify-between border-t pt-4 text-sm">
          <span className="text-primary font-semibold">
            {formatCurrency(classroom.pricePerHour)} / hour
          </span>
          <span className="gap-xs flex items-center">
            <CalendarDays aria-hidden="true" className="size-4 shrink-0" />
            <span>
              <span className="sr-only">Created </span>
              <time dateTime={classroom.createdAt}>{formatCreatedDate(classroom.createdAt)}</time>
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}
