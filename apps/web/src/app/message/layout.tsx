"use client";

import { usePathname } from "next/navigation";

import { ConversationSidebar } from "@/features/message/conversation-sidebar";

/** True only at the bare /message list route, not a specific conversation. */
function useIsListRoute(): boolean {
  return usePathname() === "/message";
}

export default function MessageLayout({ children }: { children: React.ReactNode }) {
  const isListRoute = useIsListRoute();

  return (
    <main className="bg-surface-lavender/30 h-[calc(100vh-64px)] overflow-hidden px-0 py-0 md:px-6 md:py-6 lg:px-10">
      <div className="border-hairline bg-canvas mx-auto flex h-full w-full max-w-6xl overflow-hidden md:rounded-2xl md:border md:shadow-sm">
        <ConversationSidebar className={isListRoute ? "flex" : "hidden md:flex"} />
        <div className={`min-w-0 flex-1 flex-col ${isListRoute ? "hidden md:flex" : "flex"}`}>
          {children}
        </div>
      </div>
    </main>
  );
}
