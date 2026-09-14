import type { Metadata } from "next";

import { ProfileCompletionForm } from "@/features/profile/profile-completion-form";

export const metadata: Metadata = {
  title: "Complete your profile | Tutorist",
  description: "Finish setting up your Tutorist profile.",
};

export default function CompleteProfilePage() {
  return (
    <main className="flex min-h-[calc(100vh-64px)] items-center bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <ProfileCompletionForm />
      </div>
    </main>
  );
}
