import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Classroom | Tutorist",
  description: "Details for one of your Tutorist classrooms.",
};

/**
 * Placeholder so classroom cards don't link to a 404. The real detail view
 * (lessons, schedule, ...) replaces this in its own ticket.
 */
export default function ClassroomDetailPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="gap-xl mx-auto flex w-full max-w-6xl flex-col">
        <Link
          href="/classroom"
          className="text-ink hover:text-primary gap-xs inline-flex w-fit items-center text-sm font-semibold transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to my classroom
        </Link>
        <div className="border-hairline gap-md flex flex-col items-center rounded-[10px] border border-dashed px-4 py-12 text-center">
          <h1 className="text-ink-black text-body-emphasis">Classroom details are coming soon</h1>
          <p className="text-ink text-sm">
            You&apos;ll be able to see lessons and schedules for this classroom here.
          </p>
        </div>
      </div>
    </main>
  );
}
