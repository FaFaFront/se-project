import Link from "next/link";

export default function ConversationPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/message"
          className="mb-6 inline-flex text-sm font-medium text-primary hover:underline"
        >
          ← Back to messages
        </Link>
        <p className="text-sm text-ink/60">Chat coming soon.</p>
      </div>
    </main>
  );
}
