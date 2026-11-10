import { describe, expect, test } from "@jest/globals";
import { sessionActions } from "@/features/classroom/session-state";
import { mergeMessages } from "@/features/message/utils/merge-messages";
import { formatTHB, withdrawalCents } from "@/lib/withdrawal";
import { isDefinitiveFirstRejection } from "@/lib/withdrawal-recovery";
import type { ChatMessage } from "@/types/conversation";
import type { ClassroomSession } from "@/types/session";

const START = Date.parse("2026-05-01T10:00:00.000Z");
const MIN = 60_000;

function session(overrides: Partial<ClassroomSession> = {}): ClassroomSession {
  return {
    id: "s1",
    classroomId: "c1",
    scheduledAt: new Date(START).toISOString(),
    durationHours: 1,
    status: "scheduled",
    meetLink: "https://meet",
    meetSpaceName: null,
    startedAt: null,
    endedAt: null,
    tutorJoinedAt: null,
    studentJoinedAt: null,
    amountCharged: null,
    attendanceTrackingEnabled: true,
    paymentPending: false,
    ...overrides,
  };
}

describe("sessionActions", () => {
  test.each([
    ["before the start", START - 1, false, true],
    ["at the start", START, true, true],
    ["one ms before the end", START + 60 * MIN - 1, true, true],
    ["at the end", START + 60 * MIN, false, true],
    ["inside the 1 min grace", START + 60 * MIN + 59_999, false, true],
    ["after the grace", START + 61 * MIN, false, false],
  ])("WS-01 %s (t=%i): canJoin=%s, canCancel=%s", (_label, now, canJoin, canCancel) => {
    expect(sessionActions(session(), now)).toEqual({ canJoin, canCancel });
  });

  test.each(["completed", "cancelled", "missed"] as const)(
    "WS-02 a %s session can neither be joined nor cancelled",
    (status) => {
      expect(sessionActions(session({ status }), START + MIN)).toEqual({
        canJoin: false,
        canCancel: false,
      });
    }
  );

  test("WS-03 an untracked session cannot be joined; a pending payment cannot be cancelled", () => {
    expect(sessionActions(session({ attendanceTrackingEnabled: false }), START).canJoin).toBe(
      false
    );
    expect(sessionActions(session({ paymentPending: true }), START).canCancel).toBe(false);
  });
});

describe("mergeMessages", () => {
  const msg = (id: string, createdAt: string, text = id): ChatMessage => ({
    id,
    conversationId: "c",
    text,
    createdAt,
    type: "system",
    senderId: null,
    sender: null,
  });

  test("WM-01 sorts by time, then by id for equal times", () => {
    const result = mergeMessages(
      [msg("b", "2026-01-01T00:00:02Z"), msg("c", "2026-01-01T00:00:01Z")],
      [msg("a", "2026-01-01T00:00:02Z")]
    );

    expect(result.map((m) => m.id)).toEqual(["c", "a", "b"]);
  });

  test("WM-02 a duplicate id (socket echo of history) is kept once, newest copy wins", () => {
    const result = mergeMessages(
      [msg("a", "2026-01-01T00:00:00Z", "old")],
      msg("a", "2026-01-01T00:00:00Z", "new")
    );

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("new");
  });

  test("WM-03 does not mutate the current list", () => {
    const current = [msg("b", "2026-01-01T00:00:02Z")];

    mergeMessages(current, msg("a", "2026-01-01T00:00:01Z"));

    expect(current.map((m) => m.id)).toEqual(["b"]);
  });
});

describe("withdrawalCents", () => {
  test.each([
    ["100", 10000],
    ["100.5", 10050],
    ["100.05", 10005],
    [" 0.01 ", 1],
    ["0.1", 10],
    ["9999999999.99", 999999999999],
  ])("WW-01 %j is %i satang", (input, cents) => {
    expect(withdrawalCents(input)).toBe(cents);
  });

  test.each(["", "abc", "-5", "1.234", "1e3", "1,000", "12345678901", "100.", ".5"])(
    "WW-02 %j is rejected",
    (input) => {
      expect(withdrawalCents(input)).toBeNull();
    }
  );

  test("WW-03 avoids floating point error (0.29 is not 28.999...)", () => {
    expect(withdrawalCents("0.29")).toBe(29);
    expect(withdrawalCents("1.15")).toBe(115);
  });

  test("WW-04 formatTHB shows baht with two decimals", () => {
    expect(formatTHB(123456)).toMatch(/฿\s?1,234\.56/);
  });
});

describe("isDefinitiveFirstRejection", () => {
  test.each([
    [false, 400, true],
    [false, 401, true],
    [false, 403, true],
    [false, 409, false],
    [false, 500, false],
    [true, 400, false],
  ])("WR-01 retry=%s status=%i -> %s", (wasRetry, status, expected) => {
    expect(isDefinitiveFirstRejection(wasRetry, status)).toBe(expected);
  });
});
