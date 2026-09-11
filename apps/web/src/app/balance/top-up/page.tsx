import type { Metadata } from "next";
import { TopUpForm } from "@/components/wallet/top-up-form";

export const metadata: Metadata = { title: "Top up balance | Tutorist" };

export default function TopUpPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] bg-canvas px-4 py-12">
      <TopUpForm />
    </main>
  );
}
