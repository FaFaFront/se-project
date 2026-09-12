"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Info, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PasswordForm } from "@/components/ui/password-form";
import { apiClient, ApiError } from "@/lib/api-client";
import { clearSession, getToken } from "@/lib/auth-storage";
import { formatTHB, withdrawalCents } from "@/lib/withdrawal";
import type { UserProfile } from "@/types/user";
import { WITHDRAWAL_BANKS, type Withdrawal, type WithdrawalRequest } from "@/types/withdrawal";

type Draft = Omit<WithdrawalRequest, "password">;
type Field = "amount" | "bank" | "account" | "holder" | "password";
const LOGIN = "/login?next=/balance/withdraw";

export function WithdrawalForm() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [holder, setHolder] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [receipt, setReceipt] = useState<Withdrawal | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const receiptHeading = useRef<HTMLHeadingElement>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!getToken()) {
      router.replace(LOGIN);
      return;
    }
    setError("");
    apiClient.get<UserProfile>("/users/me").then(
      (user) => {
        if (!active) return;
        if (user.role !== "tutor") {
          router.replace("/");
          return;
        }
        setBalance(Math.round(user.walletBalance * 100));
      },
      (err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          clearSession();
          router.replace(LOGIN);
        } else setError("Unable to load your balance. Please try again.");
      }
    );
    function sessionChanged() {
      setBalance(null);
      setAccount("");
      setHolder("");
      setPassword("");
      setDraft(null);
      setReceipt(null);
      setLoadVersion((value) => value + 1);
    }
    window.addEventListener("storage", sessionChanged);
    return () => {
      active = false;
      window.removeEventListener("storage", sessionChanged);
    };
  }, [router, loadVersion]);

  useEffect(() => {
    if (receipt) receiptHeading.current?.focus();
  }, [receipt]);

  useEffect(() => {
    if (!pending && !draft) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [pending, draft]);

  async function refreshBalance() {
    try {
      const user = await apiClient.get<UserProfile>("/users/me");
      if (!alive.current) return;
      if (user.role !== "tutor") {
        router.replace("/");
        return;
      }
      setBalance(Math.round(user.walletBalance * 100));
    } catch {
      if (alive.current) {
        setBalance(null);
        setError("Your receipt is saved, but the current balance could not be refreshed.");
      }
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || balance === null) return;
    const cents = withdrawalCents(amount);
    const normalizedAccount = account.trim().replace(/[ -]/g, "");
    const normalizedHolder = holder.trim().replace(/\s+/g, " ");
    const selectedBank = WITHDRAWAL_BANKS.find((item) => item.value === bank);
    const nextErrors: Partial<Record<Field, string>> = {};
    // A retry must reach the API even if the original request depleted the wallet.
    if (!draft) {
      if (cents === null || cents <= 0)
        nextErrors.amount = "Enter an amount greater than zero with up to 2 decimal places.";
      else if (cents > balance) nextErrors.amount = "Insufficient available balance.";
      if (!selectedBank) nextErrors.bank = "Select your bank.";
      if (account.length > 64 || !/^\d{6,20}$/.test(normalizedAccount))
        nextErrors.account = "Enter an account number with 6–20 digits.";
      if (!normalizedHolder || holder.trim().length > 100)
        nextErrors.holder = "Enter an account holder name (up to 100 characters).";
    }
    if (!password) nextErrors.password = "Enter your password to confirm.";
    setErrors(nextErrors);
    setError("");
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      );
      return;
    }
    const request: Draft = draft ?? {
      requestId: crypto.randomUUID(),
      amount: cents! / 100,
      bankCode: selectedBank!.value,
      accountNumber: normalizedAccount,
      accountHolderName: normalizedHolder,
    };
    const token = getToken();
    submitting.current = true;
    setPending(true);
    try {
      const result = await apiClient.post<Withdrawal>("/wallet/withdrawals", {
        ...request,
        password,
      });
      if (!alive.current || getToken() !== token) return;
      setReceipt(result);
      setDraft(null);
      setAccount("");
      setHolder("");
      setBank("");
      setAmount("");
      window.dispatchEvent(new Event("wallet-updated"));
      router.refresh();
      await refreshBalance();
    } catch (err) {
      if (!alive.current || getToken() !== token) return;
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        router.replace(LOGIN);
        return;
      }
      // Keep a frozen request after an uncertain outcome. Never generate a new ID on retry.
      if (!(err instanceof ApiError) || err.status >= 500 || err.status === 409) {
        setDraft(request);
        setError(
          err instanceof ApiError && err.status === 409
            ? "This request conflicts with an existing withdrawal. Do not submit a new withdrawal; contact support to resolve it."
            : "The result could not be confirmed. Retry the same withdrawal below; do not reload or start another withdrawal."
        );
      } else {
        setError(err.message);
        // An earlier uncertain request stays frozen even when this retry fails validation.
        if (err.status === 400) await refreshBalance();
      }
    } finally {
      submitting.current = false;
      if (alive.current) {
        setPending(false);
        setPassword("");
      }
    }
  }

  if (receipt) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-hairline bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Check aria-hidden="true" />
        </div>
        <h1 ref={receiptHeading} tabIndex={-1} className="font-outfit text-3xl font-bold">
          Withdrawal completed
        </h1>
        <p className="mt-3 text-sm text-ink/70">
          Your mock withdrawal has been recorded. No real bank transfer occurs.
        </p>
        <p className="my-6 text-4xl font-bold text-primary">
          {formatTHB(withdrawalCents(receipt.amount)!)}
        </p>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">Completed</span>
        <dl className="my-8 space-y-4 text-left text-sm">
          {[
            [
              "Bank",
              WITHDRAWAL_BANKS.find((item) => item.value === receipt.destination.bankCode)?.label ??
                receipt.destination.bankCode,
            ],
            ["Account", receipt.destination.accountNumberMasked],
            ["Account holder", receipt.destination.accountHolderName],
            ["Requested", new Date(receipt.requestedAt).toLocaleString()],
            ["Completed", new Date(receipt.completedAt).toLocaleString()],
            ["Balance after withdrawal", formatTHB(withdrawalCents(receipt.balanceAfter)!)],
            ["Reference", receipt.id],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-ink/70">{label}</dt>
              <dd className="max-w-[65%] break-words text-right font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {error && (
          <p role="alert" className="mb-4 text-sm text-error">
            {error}
          </p>
        )}
        <Button
          className="w-full"
          onClick={() => {
            setReceipt(null);
            setErrors({});
            setError("");
            setLoadVersion((value) => value + 1);
          }}
        >
          Make another withdrawal
        </Button>
      </section>
    );
  }

  if (balance === null)
    return (
      <div className="mx-auto max-w-5xl">
        <p role={error ? "alert" : "status"}>{error || "Loading your account and balance…"}</p>
        {error && (
          <Button className="mt-4" onClick={() => setLoadVersion((value) => value + 1)}>
            Try again
          </Button>
        )}
      </div>
    );
  const cents = withdrawalCents(amount) ?? 0;
  const locked = pending || draft !== null;
  return (
    <div className="mx-auto max-w-5xl text-ink">
      <p className="mb-2 text-sm font-semibold text-primary">Tutor wallet</p>
      <h1 className="font-outfit text-3xl font-bold sm:text-4xl">Withdraw your balance</h1>
      <p className="mt-3 text-ink/70">Send your earnings to your bank account.</p>
      <div className="mt-8 grid items-start gap-6 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <aside className="space-y-5">
          <section className="rounded-3xl bg-brand-plum-deepest p-7 text-white">
            <Wallet className="mb-5" aria-hidden="true" />
            <p className="text-sm text-white/80">Available balance</p>
            <p className="mt-2 break-words text-4xl font-bold">{formatTHB(balance)}</p>
            <p className="mt-4 text-xs text-white/70">THB · Available to withdraw</p>
          </section>
          <section className="rounded-3xl border border-hairline bg-white p-6">
            <h2 className="font-semibold">Withdrawal summary</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Withdrawal amount</dt>
                <dd>{formatTHB(cents)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Fee</dt>
                <dd>{formatTHB(0)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-hairline pt-4 font-semibold">
                <dt>Remaining balance</dt>
                <dd>{cents > balance ? "—" : formatTHB(balance - cents)}</dd>
              </div>
            </dl>
          </section>
          <div className="flex gap-3 rounded-2xl bg-primary/5 p-5 text-sm">
            <Info className="size-5 shrink-0 text-primary" aria-hidden="true" />
            <p>
              Mock withdrawal only. No real bank transfer occurs. Check your details before
              confirming.
            </p>
          </div>
        </aside>
        <section className="rounded-3xl border border-hairline bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center justify-between">
            <h2 className="font-outfit text-xl font-semibold">Transfer to your bank</h2>
            <Landmark className="text-primary" aria-hidden="true" />
          </div>
          <form ref={formRef} noValidate onSubmit={submit} className="space-y-7">
            <fieldset disabled={locked} className="space-y-4">
              <legend className="mb-4 font-semibold">1. Withdrawal amount</legend>
              <Input
                label="Amount (THB)"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={!!errors.amount}
                errorMessage={errors.amount}
              />
              <button
                type="button"
                disabled={locked || balance === 0}
                onClick={() => setAmount((balance / 100).toFixed(2))}
                className="text-sm font-semibold text-primary disabled:opacity-50"
              >
                Withdraw full balance
              </button>
              {balance === 0 && (
                <p className="text-sm text-ink/70">You have no available balance to withdraw.</p>
              )}
            </fieldset>
            <fieldset disabled={locked} className="space-y-4 border-t border-hairline pt-6">
              <legend className="font-semibold">2. Bank account details</legend>
              <p className="text-sm text-ink/70">Enter mock bank account details.</p>
              <Select
                label="Bank"
                options={[...WITHDRAWAL_BANKS]}
                value={bank}
                onValueChange={setBank}
                disabled={locked}
                className="w-full"
                error={!!errors.bank}
                errorMessage={errors.bank}
              />
              <Input
                label="Account number"
                inputMode="numeric"
                autoComplete="off"
                maxLength={64}
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                error={!!errors.account}
                errorMessage={errors.account}
              />
              <Input
                label="Account holder name"
                autoComplete="off"
                maxLength={100}
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                error={!!errors.holder}
                errorMessage={errors.holder}
              />
            </fieldset>
            <div className="space-y-4 border-t border-hairline pt-6">
              <h3 className="font-semibold">3. Confirm it’s you</h3>
              <PasswordForm
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={pending}
                autoComplete="current-password"
                className="max-w-none"
                error={!!errors.password}
                errorMessage={errors.password}
              />
              <p className="text-xs text-ink/70">
                Use your Tutorist password to confirm this withdrawal.
              </p>
            </div>
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
            {draft && (
              <p className="text-sm text-ink/70">
                Details are locked to protect against duplicate withdrawals. Re-enter your password
                to retry this request.
              </p>
            )}
            <Button
              type="submit"
              isLoading={pending}
              disabled={pending || (!draft && balance === 0)}
              className="w-full"
            >
              {draft ? "Retry same withdrawal" : "Confirm mock withdrawal"}
              <ArrowUpRight className="ml-2 size-4" aria-hidden="true" />
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
