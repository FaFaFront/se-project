import { MessageCircle } from "lucide-react";

export default function MessagePage() {
  return (
    <div className="gap-sm flex h-full flex-1 flex-col items-center justify-center p-8 text-center">
      <MessageCircle aria-hidden="true" className="text-placeholder size-10" />
      <p className="text-ink-black text-body-emphasis">Select a chat</p>
      <p className="text-ink/60 text-sm">Choose a conversation from the list to start messaging.</p>
    </div>
  );
}
