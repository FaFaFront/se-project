import type { Metadata } from "next";

import { TutorDetailPanel } from "@/features/tutors/tutor-detail-panel";

export const metadata: Metadata = {
  title: "Tutor profile | Tutorist",
  description: "View a tutor's subjects, experience, and student reviews.",
};

type TutorDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TutorDetailPage({ params }: TutorDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-4xl">
        <TutorDetailPanel tutorId={id} />
      </div>
    </main>
  );
}
