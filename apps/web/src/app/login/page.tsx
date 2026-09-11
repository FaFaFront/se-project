import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata: Metadata = {
  title: "Log in | Tutorist",
  description: "Log in to your Tutorist account.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const redirectTo = next === "/balance/withdraw" ? next : "/";
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-base py-3xl">
      <LoginPanel redirectTo={redirectTo} />
    </main>
  );
}
