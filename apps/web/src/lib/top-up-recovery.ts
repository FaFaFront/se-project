import type { TopUpRequest } from "../types/transaction";

export type TopUpRecovery = TopUpRequest & { version: 1 };
export const topUpRecoveryKey = (userId: string) => `tutorist.topup.pending.v1.${userId}`;
const storageError =
  "Top-up recovery is unavailable or invalid. Reload to reconcile your previous top-up before submitting another.";

export function readTopUpRecovery(userId: string): TopUpRecovery | null {
  try {
    const raw = window.localStorage.getItem(topUpRecoveryKey(userId));
    if (raw === null) return null;
    const data = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      Object.keys(data).sort().join(",") !== "amount,requestId,version" ||
      data.version !== 1 ||
      typeof data.requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        data.requestId
      ) ||
      typeof data.amount !== "number" ||
      !Number.isSafeInteger(data.amount) ||
      data.amount <= 0
    ) {
      throw new Error(storageError);
    }
    return data as TopUpRecovery;
  } catch {
    throw new Error(storageError);
  }
}

/** Called under the user-scoped Web Lock; uncertain requests must not be replaced. */
export function saveTopUpRecovery(userId: string, record: TopUpRecovery): void {
  const recovery: TopUpRecovery = {
    version: record.version,
    requestId: record.requestId,
    amount: record.amount,
  };
  const existing = readTopUpRecovery(userId);
  if (
    existing &&
    (existing.requestId !== recovery.requestId || existing.amount !== recovery.amount)
  ) {
    throw new Error("Another top-up needs recovery. Reload and retry the original request first.");
  }
  try {
    const raw = JSON.stringify(recovery);
    window.localStorage.setItem(topUpRecoveryKey(userId), raw);
    if (window.localStorage.getItem(topUpRecoveryKey(userId)) !== raw)
      throw new Error(storageError);
  } catch {
    throw new Error(storageError);
  }
}

export function clearTopUpRecovery(userId: string, requestId: string): void {
  const existing = readTopUpRecovery(userId);
  if (!existing || existing.requestId !== requestId) return;
  try {
    window.localStorage.removeItem(topUpRecoveryKey(userId));
    if (window.localStorage.getItem(topUpRecoveryKey(userId)) !== null)
      throw new Error(storageError);
  } catch {
    throw new Error(storageError);
  }
}
