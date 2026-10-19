import type { Metadata } from "next";

import { TutorListPanel } from "@/features/tutors/tutor-list-panel";

export const metadata: Metadata = {
  title: "Find tutors | Tutorist",
  description: "Browse active tutors by subject, price, rating, and popularity.",
};

export default function TutorsPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="gap-xl mx-auto flex w-full max-w-6xl flex-col">
        <h1 className="text-heading-md text-ink-black">Find tutors</h1>
        <TutorListPanel />
      </div>
    </main>
  );
}
