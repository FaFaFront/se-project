import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ChatContainer } from "@/features/message/chat-container";

export const metadata: Metadata = {
  title: "Conversation | Tutorist",
  description: "Chat with your Tutorist conversation partner.",
};

type ConversationPageProps = {
  params: Promise<{ conversationId: string }>;
};

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-surface-lavender px-4 py-5 sm:px-6 sm:py-8 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/message"
          className="group mb-4 inline-flex min-h-11 items-center gap-2.5 rounded-full border border-hairline bg-canvas/90 py-2 pl-2 pr-4 text-sm font-semibold text-ink shadow-sm backdrop-blur-sm transition-all duration-200 hover:-translate-x-0.5 hover:border-primary/30 hover:text-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-200 group-hover:-translate-x-0.5"
            />
          </span>
          <span>Back</span>
        </Link>
        <ChatContainer key={conversationId} conversationId={conversationId} />
      </div>
    </main>
  );
}
