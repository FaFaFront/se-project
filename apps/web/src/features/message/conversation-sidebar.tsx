"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/auth-context";
import { ProfileAvatar } from "@/features/profile/profile-avatar";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types/conversation";

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export interface ConversationSidebarProps {
  className?: string;
}

/** The chat list on the left of /message — always mounted, highlights the open conversation. */
export function ConversationSidebar({ className }: ConversationSidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>();
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isStale = false;

    apiClient.get<Conversation[]>("/conversations").then(
      (data) => {
        if (!isStale) setConversations(data);
      },
      () => {
        if (!isStale) setError(true);
      }
    );

    return () => {
      isStale = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!conversations) return conversations;
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((conversation) =>
      (conversation.otherParticipant.name ?? "").toLowerCase().includes(term)
    );
  }, [conversations, search]);

  return (
    <aside
      className={cn(
        "border-hairline bg-canvas flex w-full flex-col border-r md:w-80 lg:w-96",
        className
      )}
    >
      <div className="border-hairline border-b px-4 py-4 sm:px-5">
        <h1 className="text-heading-md text-ink-black">Chats</h1>
      </div>

      <div className="px-4 py-3 sm:px-5">
        <div className="relative">
          <Search
            aria-hidden="true"
            className="text-placeholder pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            aria-label="Search chats"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="bg-surface-lavender/40 border-transparent pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!conversations && !error && (
          <p role="status" className="text-ink/60 px-5 py-6 text-center text-sm">
            Loading chats…
          </p>
        )}

        {error && (
          <p role="alert" className="text-error px-5 py-6 text-center text-sm">
            Could not load chats.
          </p>
        )}

        {filtered?.length === 0 && (
          <div className="gap-xs flex flex-col px-5 py-6 text-center">
            <p className="text-ink/60 text-sm">
              {search ? "No chats match your search." : "No conversations yet."}
            </p>
            {!search && profile?.role === "student" && (
              <Link href="/tutors" className="text-primary text-sm font-semibold hover:underline">
                Browse tutors
              </Link>
            )}
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <ul>
            {filtered.map((conversation) => {
              const isActive = pathname === `/message/${conversation.id}`;
              const name = conversation.otherParticipant.name?.trim() || "Unknown user";

              return (
                <li key={conversation.id}>
                  <Link
                    href={`/message/${conversation.id}`}
                    className={cn(
                      "border-hairline flex items-center gap-3 border-b px-4 py-3 transition-colors sm:px-5",
                      isActive ? "bg-primary/10" : "hover:bg-surface-lavender/60"
                    )}
                  >
                    <ProfileAvatar
                      src={conversation.otherParticipant.profileUrl}
                      name={name}
                      size={44}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-ink-black truncate text-sm font-semibold" title={name}>
                          {name}
                        </p>
                        {conversation.lastMessage && (
                          <span
                            suppressHydrationWarning
                            className="text-placeholder shrink-0 text-xs"
                          >
                            {relativeTime(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="text-ink/60 truncate text-xs">
                        {conversation.lastMessage?.type === "system" ? "System: " : ""}
                        {conversation.lastMessage?.text ?? "No messages yet"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
