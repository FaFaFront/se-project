"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ConversationCard } from "@/components/conversations/ConversationCard";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api-client";
import type { Conversation } from "@/types/conversation";

export default function MessagePage() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>();
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isStale = false;
    setError(false);
    setConversations(undefined);

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
  }, [reloadKey]);

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="font-outfit mb-6 text-2xl font-bold text-ink">Messages</h1>

        {!conversations && !error && (
          <p role="status" className="text-sm text-ink/60">
            Loading conversations…
          </p>
        )}

        {error && (
          <div className="gap-base flex flex-col items-start">
            <p className="text-sm text-ink/60">Could not load conversations. Please try again.</p>
            <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
              Retry
            </Button>
          </div>
        )}

        {conversations?.length === 0 && (
          <div className="border-hairline gap-md flex flex-col items-center rounded-[10px] border border-dashed px-4 py-12 text-center">
            <p className="text-ink-black text-body-emphasis">
              You don&apos;t have any conversations yet.
            </p>
            {profile?.role === "student" && (
              <>
                <p className="text-sm text-ink/60">
                  Visit a tutor&apos;s profile and press Message to start chatting.
                </p>
                <Link href="/tutors" className="text-primary text-sm font-semibold hover:underline">
                  Browse tutors
                </Link>
              </>
            )}
          </div>
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
