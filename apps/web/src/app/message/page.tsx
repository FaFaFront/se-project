"use client";

import { useEffect, useState } from "react";

import { ConversationCard } from "@/components/conversations/ConversationCard";
import { apiClient } from "@/lib/api-client";
import type { Conversation } from "@/types/conversation";

export default function MessagePage() {
  const [conversations, setConversations] = useState<Conversation[]>();
  const [error, setError] = useState(false);

  useEffect(() => {
    apiClient.get<Conversation[]>("/conversations").then(setConversations, () => setError(true));
  }, []);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="font-outfit mb-6 text-2xl font-bold text-ink">Messages</h1>

        {!conversations && !error && <p className="text-sm text-ink/60">Loading...</p>}

        {error && (
          <p className="text-sm text-ink/60">Could not load conversations. Please try again.</p>
        )}

        {conversations?.length === 0 && (
          <p className="text-sm text-ink/60">No conversations yet.</p>
        )}

        {conversations && conversations.length > 0 && (
          <div className="flex flex-col gap-3">
            {conversations.map((c) => (
              <ConversationCard key={c.id} conversation={c} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
