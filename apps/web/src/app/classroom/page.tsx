import type { Metadata } from "next";

import { ClassroomListPanel } from "@/features/classroom/classroom-list-panel";

export const metadata: Metadata = {
  title: "My classroom | Tutorist",
  description: "Search and filter the classrooms you teach.",
};

export default function ClassroomPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="gap-xl mx-auto flex w-full max-w-6xl flex-col">
        <h1 className="text-heading-md text-ink-black">My classroom</h1>
        <ClassroomListPanel />
      </div>
    </main>
  );
}
