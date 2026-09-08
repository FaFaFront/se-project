import type { Metadata } from "next";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export const metadata: Metadata = {
  title: "Edit your profile | Tutorist",
  description: "Update your Tutorist profile information.",
};

export default function ProfilePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <ProfileEditForm />
      </div>
    </main>
  );
}
