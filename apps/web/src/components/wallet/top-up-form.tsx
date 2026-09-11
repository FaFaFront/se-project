"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { getToken, getUser } from "@/lib/auth-storage";
import type { Wallet, WalletBalance } from "@/types/wallet";

export function TopUpForm() {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    if (getUser()?.role !== "student") {
      router.replace("/");
      return;
    }
    let active = true;
    apiClient.get<Wallet>("/wallet").then(
      (data) => {
        if (active) setWallet(data);
      },
      (err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load your balance.");
      }
    );
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !wallet) return;
    setError("");
    setSuccess("");
    if (amount === null || !wallet.topUpAmounts.includes(amount)) {
      setError("Please select a top-up amount before confirming.");
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const updated = await apiClient.post<WalletBalance>("/wallet/top-up", { amount });
      setWallet({ ...wallet, ...updated });
      setAmount(null);
      setSuccess(`Added $${amount} in demo credit to your balance.`);
      window.dispatchEvent(new Event("wallet-updated"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to top up your balance.");
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (!wallet) {
    return (
      <p className="mx-auto max-w-xl" role={error ? "alert" : "status"}>
        {error || "Loading your balance…"}
      </p>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-hairline bg-white p-6 shadow-sm sm:p-10">
      <p className="text-sm font-medium text-primary">Student account</p>
      <h1 className="mt-2 font-outfit text-3xl font-bold text-ink">Top up balance</h1>
      <p className="mt-3 text-sm text-ink/70">
        Add demo credit to access teaching services. This is a simulated top-up; no real money is
        charged.
      </p>
      <div className="my-8 rounded-2xl bg-primary/10 p-5" aria-live="polite">
        <p className="text-sm text-ink/70">Current balance</p>
        <p className="mt-1 text-3xl font-bold text-brand-plum-deepest">
          ${Number(wallet.walletBalance).toFixed(2)}
        </p>
      </div>
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={pending} aria-describedby={error ? "top-up-error" : undefined}>
          <legend className="mb-3 font-semibold text-ink">Choose an amount</legend>
          <div className="grid grid-cols-2 gap-3">
            {wallet.topUpAmounts.map((preset) => (
              <label
                key={preset}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-5 ${amount === preset ? "border-primary bg-primary/10" : "border-hairline"}`}
              >
                <input
                  type="radio"
                  name="amount"
                  value={preset}
                  checked={amount === preset}
                  onChange={() => {
                    setAmount(preset);
                    setError("");
                    setSuccess("");
                  }}
                  className="accent-primary"
                />
                <span className="text-lg font-semibold">${preset}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {error && (
          <p id="top-up-error" role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-sm text-ink">
            {success}
          </p>
        )}
        <Button type="submit" isLoading={pending} className="w-full">
          Confirm mock top-up{amount !== null ? ` · $${amount}` : ""}
        </Button>
      </form>
    </section>
  );
}
