import { afterEach, describe, expect, test } from "@jest/globals";
import { clearSession, getToken, getUser, saveSession, saveUser } from "@/lib/auth-storage";
import {
  clearTopUpRecovery,
  readTopUpRecovery,
  saveTopUpRecovery,
  topUpRecoveryKey,
  type TopUpRecovery,
} from "@/lib/top-up-recovery";
import {
  clearRecovery,
  readRecovery,
  recoveryKey,
  saveRecovery,
  type WithdrawalRecovery,
} from "@/lib/withdrawal-recovery";
import { installLocalStorage, removeWindow } from "./helpers";

const USER = "user-1";
const REQUEST = "11111111-1111-4111-8111-111111111111";
const OTHER_REQUEST = "22222222-2222-4222-8222-222222222222";
const user = { id: USER, name: "Amy", email: "a@b.c", role: "student", profileUrl: null };

afterEach(removeWindow);

describe("auth-storage", () => {
  test("WA-01 saves and reads back the token and user", () => {
    installLocalStorage();

    saveSession({ token: "t", user } as never);

    expect(getToken()).toBe("t");
    expect(getUser()).toEqual(user);
  });

  test("WA-02 clearSession removes both; saveUser replaces only the user", () => {
    installLocalStorage();
    saveSession({ token: "t", user } as never);

    saveUser({ ...user, name: "New" } as never);
    expect(getToken()).toBe("t");
    expect(getUser()).toMatchObject({ name: "New" });

    clearSession();
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });

  test("WA-03 corrupt stored user reads as null", () => {
    installLocalStorage().set("tutorist.auth.user", "{bad");

    expect(getUser()).toBeNull();
  });

  test("WA-04 during SSR (no window) every call is a safe no-op", () => {
    removeWindow();

    expect(() => saveSession({ token: "t", user } as never)).not.toThrow();
    expect(() => saveUser(user as never)).not.toThrow();
    expect(() => clearSession()).not.toThrow();
    expect(getToken()).toBeNull();
  });

  test("WA-05 storage that throws (private mode) never crashes the page", () => {
    installLocalStorage({ broken: true });

    expect(() => saveSession({ token: "t", user } as never)).not.toThrow();
    expect(() => clearSession()).not.toThrow();
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });
});

describe("top-up recovery", () => {
  const record: TopUpRecovery = { version: 1, requestId: REQUEST, amount: 500 };

  test("WT-01 empty storage reads as null", () => {
    installLocalStorage();

    expect(readTopUpRecovery(USER)).toBeNull();
  });

  test("WT-02 save stores only the recovery fields and reads them back", () => {
    const store = installLocalStorage();

    saveTopUpRecovery(USER, { ...record, password: "x" } as never);

    expect(JSON.parse(store.get(topUpRecoveryKey(USER))!)).toEqual(record);
    expect(readTopUpRecovery(USER)).toEqual(record);
  });

  test("WT-03 saving the same request again is allowed; a different one is blocked", () => {
    installLocalStorage();
    saveTopUpRecovery(USER, record);

    expect(() => saveTopUpRecovery(USER, record)).not.toThrow();
    expect(() => saveTopUpRecovery(USER, { ...record, requestId: OTHER_REQUEST })).toThrow(
      "Another top-up needs recovery"
    );
    expect(() => saveTopUpRecovery(USER, { ...record, amount: 100 })).toThrow("Another top-up");
  });

  test("WT-04 clear only removes the matching request", () => {
    const store = installLocalStorage();
    saveTopUpRecovery(USER, record);

    clearTopUpRecovery(USER, OTHER_REQUEST);
    expect(store.has(topUpRecoveryKey(USER))).toBe(true);

    clearTopUpRecovery(USER, REQUEST);
    expect(store.has(topUpRecoveryKey(USER))).toBe(false);
  });

  test("WT-05 recovery is per user", () => {
    installLocalStorage();
    saveTopUpRecovery(USER, record);

    expect(readTopUpRecovery("user-2")).toBeNull();
  });

  test.each([
    ["not JSON", "{"],
    ["wrong version", JSON.stringify({ ...record, version: 2 })],
    ["extra field", JSON.stringify({ ...record, extra: 1 })],
    ["non-v4 request id", JSON.stringify({ ...record, requestId: "abc" })],
    ["zero amount", JSON.stringify({ ...record, amount: 0 })],
    ["fractional amount", JSON.stringify({ ...record, amount: 1.5 })],
    ["null", "null"],
  ])("WT-06 tampered storage (%s) blocks instead of being ignored", (_label, raw) => {
    installLocalStorage().set(topUpRecoveryKey(USER), raw);

    expect(() => readTopUpRecovery(USER)).toThrow("Top-up recovery is unavailable or invalid");
  });

  test("WT-07 unavailable storage blocks", () => {
    installLocalStorage({ broken: true });

    expect(() => readTopUpRecovery(USER)).toThrow("unavailable");
  });
});

describe("withdrawal recovery", () => {
  const record: WithdrawalRecovery = {
    version: 1,
    requestId: REQUEST,
    amount: 250.5,
    bankCode: "KBANK",
    createdAt: "2026-05-01T10:00:00.000Z",
  };

  test("WD-01 save keeps only recovery metadata (never the account number or password)", () => {
    const store = installLocalStorage();

    saveRecovery(USER, { ...record, accountNumber: "123", password: "pw" } as never);

    const saved = store.get(recoveryKey(USER))!;
    expect(JSON.parse(saved)).toEqual(record);
    expect(saved).not.toContain("pw");
    expect(readRecovery(USER)).toEqual(record);
  });

  test("WD-02 a different pending withdrawal is never overwritten", () => {
    installLocalStorage();
    saveRecovery(USER, record);

    expect(() => saveRecovery(USER, { ...record, bankCode: "SCB" })).toThrow(
      "Another withdrawal needs recovery"
    );
  });

  test("WD-03 clear only removes the matching request", () => {
    const store = installLocalStorage();
    saveRecovery(USER, record);

    clearRecovery(USER, OTHER_REQUEST);
    expect(store.has(recoveryKey(USER))).toBe(true);
    clearRecovery(USER, REQUEST);
    expect(store.has(recoveryKey(USER))).toBe(false);
  });

  test.each([
    ["unknown bank", { ...record, bankCode: "XYZ" }],
    ["3 decimal amount", { ...record, amount: 1.005 }],
    ["negative amount", { ...record, amount: -1 }],
    ["bad date", { ...record, createdAt: "yesterday" }],
    ["missing field", { version: 1, requestId: REQUEST, amount: 1, bankCode: "KBANK" }],
  ])("WD-04 tampered storage (%s) blocks", (_label, data) => {
    installLocalStorage().set(recoveryKey(USER), JSON.stringify(data));

    expect(() => readRecovery(USER)).toThrow(
      "Withdrawal recovery storage is unavailable or invalid"
    );
  });
});
