import type { Metadata } from "next";

import { ProfileCompletionForm } from "@/components/profile/profile-completion-form";

export const metadata: Metadata = {
  title: "Complete your profile | Tutorist",
  description: "Finish setting up your Tutorist profile.",
};

type CompleteProfilePageProps = {
  searchParams: Promise<{ role?: string }>;
};

export default async function CompleteProfilePage({ searchParams }: CompleteProfilePageProps) {
  const { role } = await searchParams;
  const profileRole = role === "tutor" ? "tutor" : "student";

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[linear-gradient(145deg,#faf8ff_0%,#ffffff_50%,#f6f0ff_100%)] px-4 py-10 sm:px-6 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <ProfileCompletionForm role={profileRole} />
      </div>
    </main>
  );
}
