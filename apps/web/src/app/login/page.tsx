import type { Metadata } from "next";
import { LoginPanel } from "@/components/auth/login-panel";

export const metadata: Metadata = {
  title: "Log in | Tutorist",
  description: "Log in to your Tutorist account.",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-base py-3xl">
      <LoginPanel />
    </main>
  );
}
