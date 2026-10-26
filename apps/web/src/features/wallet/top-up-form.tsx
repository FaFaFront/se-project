"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ApiError, apiClient } from "@/lib/api-client";
import { getToken } from "@/lib/auth-storage";
import {
  clearTopUpRecovery,
  readTopUpRecovery,
  saveTopUpRecovery,
  topUpRecoveryKey,
  type TopUpRecovery,
} from "@/lib/top-up-recovery";
import type { TopUp, TopUpOptions } from "@/types/transaction";

export function TopUpForm() {
  const router = useRouter();
  const { profile, isLoading, error: authError, refresh } = useAuth();
  const [options, setOptions] = useState<TopUpOptions | null>(null);
  const [draft, setDraft] = useState<TopUpRecovery | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [loadVersion, setLoadVersion] = useState(0);
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const alive = useRef(true);
  const userId = profile?.id;

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    setOptions(null);
    setBlocked(false);
    setError("");
    setSuccess("");
    try {
      const saved = readTopUpRecovery(userId);
      setDraft(saved);
      setAmount(saved?.amount ?? null);
      if (saved)
        setError(
          "A previous top-up needs confirmation. Retry the same top-up to recover its result."
        );
    } catch (err) {
      setBlocked(true);
      setError(err instanceof Error ? err.message : "Unable to read top-up recovery.");
    }
    apiClient.get<TopUpOptions>("/transactions/top-ups/options").then(
      (data) => {
        if (active) setOptions(data);
      },
      (err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load your balance.");
      }
    );
    function recoveryChanged(event: StorageEvent) {
      if (event.key === null || event.key === topUpRecoveryKey(userId!)) {
        setLoadVersion((value) => value + 1);
        void refresh();
      }
    }
    window.addEventListener("storage", recoveryChanged);
    return () => {
      active = false;
      window.removeEventListener("storage", recoveryChanged);
    };
  }, [userId, loadVersion, refresh]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !options || !profile || profile.role !== "student" || blocked) return;
    setError("");
    setSuccess("");
    if (amount === null || (!draft && !options.topUpAmounts.includes(amount))) {
      setError("Please select a top-up amount before confirming.");
      return;
    }
    submitting.current = true;
    setPending(true);
    const token = getToken();
    const current = () => alive.current && getToken() === token;
    const wasRetry = draft !== null;
    const request: TopUpRecovery = draft ?? { version: 1, requestId: crypto.randomUUID(), amount };
    let sent = false;
    try {
      if (!navigator.locks)
        throw new Error(
          "This browser cannot safely coordinate top-up recovery. Use a supported browser over HTTPS or localhost."
        );
      await navigator.locks.request(
        topUpRecoveryKey(profile.id),
        { ifAvailable: true },
        async (lock) => {
          if (!lock)
            throw new Error(
              "Another tab is submitting a top-up. Check its result, then reload this page."
            );
          if (!current()) return;
          const existing = readTopUpRecovery(profile.id);
          if ((existing?.requestId ?? null) !== (draft?.requestId ?? null))
            throw new Error("Top-up recovery changed in another tab. Reload before continuing.");
          saveTopUpRecovery(profile.id, request);
          setDraft(request);
          sent = true;
          const result = await apiClient
            .post<TopUp>("/transactions/top-ups", {
              requestId: request.requestId,
              amount: request.amount,
            })
            .catch((err: unknown) => {
              if (
                current() &&
                !wasRetry &&
                err instanceof ApiError &&
                [400, 401, 403].includes(err.status)
              ) {
                clearTopUpRecovery(profile.id, request.requestId);
                setDraft(null);
              }
              throw err;
            });
          if (!current()) return;
          clearTopUpRecovery(profile.id, request.requestId);
          setDraft(null);
          setAmount(null);
          setSuccess(
            `Confirmed $${Number(result.amount)} in demo credit. Your top-up was recorded once.`
          );
          void refresh();
          router.refresh();
        }
      );
    } catch (err) {
      if (!current()) return;
      if (!sent) setBlocked(true);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to confirm your top-up. Retry the same top-up to recover its result."
      );
    } finally {
      submitting.current = false;
      if (alive.current) setPending(false);
    }
  }

  if (isLoading || !profile || !options) {
    return (
      <p className="mx-auto max-w-xl" role={error || authError ? "alert" : "status"}>
        {error || authError || "Loading your balance…"}
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
          ${profile.walletBalance.toFixed(2)}
        </p>
      </div>
      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <fieldset
          disabled={pending || !!draft || blocked}
          aria-describedby={error ? "top-up-error" : undefined}
        >
          <legend className="mb-3 font-semibold text-ink">Choose an amount</legend>
          <div className="grid grid-cols-2 gap-3">
            {options.topUpAmounts.map((preset) => (
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
        <Button type="submit" isLoading={pending} disabled={blocked} className="w-full">
          {draft ? "Retry same top-up" : "Confirm mock top-up"}
          {amount !== null ? ` · $${amount}` : ""}
        </Button>
      </form>
    </section>
  );
}
