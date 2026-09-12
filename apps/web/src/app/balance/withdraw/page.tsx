import type { Metadata } from "next";
import { WithdrawalForm } from "@/components/wallet/withdrawal-form";

export const metadata: Metadata = { title: "Withdraw balance | Tutorist" };

export default function WithdrawalPage() {
  return (
    <main className="min-h-[70vh] bg-canvas px-4 py-10 sm:py-14">
      <WithdrawalForm />
    </main>
  );
}
