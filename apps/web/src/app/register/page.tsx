import type { Metadata } from "next";

import { RegistrationPanel } from "@/components/auth/registration-panel";

export const metadata: Metadata = {
  title: "Sign up | Tutorist",
  description: "Create a Tutorist account.",
};

export default function RegistrationPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-base py-3xl">
      <RegistrationPanel />
    </main>
  );
}
