import type { Metadata } from "next";

import { ProfilePanel } from "@/components/profile/profile-panel";

export const metadata: Metadata = {
  title: "My profile | Tutorist",
  description: "View and update your Tutorist profile.",
};

export default function ProfilePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <ProfilePanel />
      </div>
    </main>
  );
}
