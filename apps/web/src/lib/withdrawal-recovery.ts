import { THAI_BANK_CODES, type ThaiBankCode } from "@tutorist/shared";
import { withdrawalCents } from "./withdrawal";

export type WithdrawalRecovery = {
  version: 1;
  requestId: string;
  amount: number;
  bankCode: ThaiBankCode;
  createdAt: string;
};

export const recoveryKey = (userId: string) => `tutorist.withdrawal.pending.v1.${userId}`;
export function isDefinitiveFirstRejection(wasRetry: boolean, status: number): boolean {
  return !wasRetry && [400, 401, 403].includes(status);
}
const storageError =
  "Withdrawal recovery storage is unavailable or invalid. Submission is blocked; do not clear it before reconciling your previous withdrawal.";

export function readRecovery(userId: string): WithdrawalRecovery | null {
  try {
    const raw = window.localStorage.getItem(recoveryKey(userId));
    if (raw === null) return null;
    const data = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      Object.keys(data).sort().join(",") !== "amount,bankCode,createdAt,requestId,version" ||
      data.version !== 1 ||
      typeof data.requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        data.requestId
      ) ||
      typeof data.amount !== "number" ||
      data.amount <= 0 ||
      withdrawalCents(String(data.amount)) === null ||
      !THAI_BANK_CODES.includes(data.bankCode) ||
      typeof data.createdAt !== "string" ||
      !Number.isFinite(Date.parse(data.createdAt))
    )
      throw new Error(storageError);
    return data as WithdrawalRecovery;
  } catch {
    throw new Error(storageError);
  }
}

/** Call while holding the user-scoped Web Lock. Never overwrite another pending attempt. */
export function saveRecovery(userId: string, record: WithdrawalRecovery): void {
  const existing = readRecovery(userId);
  if (existing && JSON.stringify(existing) !== JSON.stringify(record)) {
    throw new Error("Another withdrawal needs recovery. Reload this page to reconcile it first.");
  }
  try {
    const raw = JSON.stringify(record);
    window.localStorage.setItem(recoveryKey(userId), raw);
    if (window.localStorage.getItem(recoveryKey(userId)) !== raw) throw new Error(storageError);
  } catch {
    throw new Error(storageError);
  }
}

export function clearRecovery(userId: string, requestId: string): void {
  const existing = readRecovery(userId);
  if (!existing || existing.requestId !== requestId) return;
  try {
    window.localStorage.removeItem(recoveryKey(userId));
    if (window.localStorage.getItem(recoveryKey(userId)) !== null) throw new Error(storageError);
  } catch {
    throw new Error(storageError);
  }
}
