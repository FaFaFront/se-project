import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export const metadata: Metadata = {
  title: "Edit profile | Tutorist",
  description: "Update your Tutorist profile.",
};

export default function EditProfilePage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#faf9fc] px-4 py-4 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/profile"
          className="mb-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/[0.8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to profile
        </Link>
        <ProfileEditForm />
      </div>
    </main>
  );
}
