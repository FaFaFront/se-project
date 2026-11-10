import type { Metadata } from "next";

import { RegistrationPanel } from "@/features/auth/registration-panel";
import type { RegistrationRole } from "@/features/auth/registration-form";

export const metadata: Metadata = {
  title: "Sign up | Tutorist",
  description: "Create a Tutorist account.",
};

const VALID_ROLES: RegistrationRole[] = ["student", "tutor"];

export default async function RegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const defaultRole: RegistrationRole = VALID_ROLES.includes(role as RegistrationRole)
    ? (role as RegistrationRole)
    : "student";

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-base py-3xl">
      <RegistrationPanel defaultRole={defaultRole} />
    </main>
  );
}
