import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import {
  AppError,
  BadRequestError,
  ConfigurationError,
  ConflictError,
  ExternalServiceError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../src/common/errors/app-error.js";
import { errorResponse, successResponse } from "../src/common/utils/response.js";
import {
  attendanceOpen,
  scheduledEnd,
  serializeSession,
  SETTLEMENT_GRACE_MS,
  settlementDue,
} from "../src/common/utils/session.js";
import { startSessionScheduler } from "../src/common/utils/session-scheduler.js";
import {
  readTopUpMetadata,
  serializeTopUpMetadata,
  type TopUpMetadata,
} from "../src/common/utils/top-up-metadata.js";
import { transactionRequestId } from "../src/common/utils/transaction-id.js";
import {
  readWithdrawalMetadata,
  serializeWithdrawalMetadata,
  withdrawalTransactionId,
  type WithdrawalMetadata,
} from "../src/common/utils/withdrawal-metadata.js";
import { conversationRoomName, isConversationRoom } from "../src/socket/utils/conversation-room.js";
import {
  createSocketAckFailure,
  createSocketConnectionError,
} from "../src/socket/utils/socket-error.js";
import { ID } from "./helpers.js";

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("errors and responses", () => {
  test.each([
    ["BadRequestError", new BadRequestError(), 400, "Bad request"],
    ["UnauthorizedError", new UnauthorizedError(), 401, "Unauthorized"],
    ["ForbiddenError", new ForbiddenError(), 403, "Forbidden"],
    ["NotFoundError", new NotFoundError(), 404, "Not found"],
    ["ConflictError", new ConflictError(), 409, "Conflict"],
    ["ConfigurationError", new ConfigurationError(), 500, "Server configuration error"],
    ["ExternalServiceError", new ExternalServiceError(), 502, "External service error"],
  ])("UT-01 %s has the right status, message and name", (name, error, status, message) => {
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(status);
    expect(error.message).toBe(message);
    expect(error.name).toBe(name);
  });

  test("UT-02 ExternalServiceError accepts a custom status", () => {
    expect(new ExternalServiceError("down", 503).statusCode).toBe(503);
  });

  test("UT-03 successResponse wraps data and defaults the message to OK", () => {
    expect(successResponse({ a: 1 })).toEqual({ success: true, message: "OK", data: { a: 1 } });
    expect(successResponse(null, "Done").message).toBe("Done");
  });

  test("UT-04 errorResponse carries only the message", () => {
    expect(errorResponse("Nope")).toEqual({ success: false, message: "Nope" });
  });
});

describe("transaction ids", () => {
  test("UT-05 builds a stable, valid UUIDv5", () => {
    const id = transactionRequestId("topup", ID.user, ID.request);

    expect(id).toBe(transactionRequestId("topup", ID.user, ID.request));
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test("UT-06 ignores the letter case of the request id", () => {
    const lower = "abcdef12-1111-4111-8111-111111111111";

    expect(transactionRequestId("topup", ID.user, lower.toUpperCase())).toBe(
      transactionRequestId("topup", ID.user, lower)
    );
  });

  test("UT-07 differs per type and per user, so ids can't collide across them", () => {
    const base = transactionRequestId("topup", ID.user, ID.request);

    expect(transactionRequestId("withdrawal", ID.user, ID.request)).not.toBe(base);
    expect(transactionRequestId("topup", ID.other, ID.request)).not.toBe(base);
  });
});

describe("session timing", () => {
  const start = new Date("2026-01-01T10:00:00.000Z");
  const session = { scheduledAt: start, durationHours: new Prisma.Decimal("1.5") };
  const end = new Date("2026-01-01T11:30:00.000Z");

  test("UT-08 scheduledEnd adds the duration", () => {
    expect(scheduledEnd(session)).toEqual(end);
  });

  test("UT-09 settlement is due only after the 15 minute grace period", () => {
    expect(SETTLEMENT_GRACE_MS).toBe(900_000);
    expect(settlementDue(session, new Date(end.getTime() + 899_999))).toBe(false);
    expect(settlementDue(session, new Date(end.getTime() + 900_000))).toBe(true);
  });

  test("UT-10 attendance is open from the start until just before the end", () => {
    expect(attendanceOpen(session, new Date(start.getTime() - 1))).toBe(false);
    expect(attendanceOpen(session, start)).toBe(true);
    expect(attendanceOpen(session, new Date(end.getTime() - 1))).toBe(true);
    expect(attendanceOpen(session, end)).toBe(false);
  });

  const row = {
    id: ID.session,
    classroomId: ID.classroom,
    scheduledAt: start,
    durationHours: new Prisma.Decimal("1.5"),
    status: "ongoing",
    meetLink: "https://meet",
    meetSpaceName: null,
    startedAt: null,
    endedAt: null,
    tutorJoinedAt: start,
    studentJoinedAt: start,
    amountCharged: new Prisma.Decimal("150.5"),
    attendanceTrackingEnabled: true,
  } as never as Parameters<typeof serializeSession>[0];
  const afterGrace = new Date(end.getTime() + SETTLEMENT_GRACE_MS);

  test("UT-11 serializeSession converts dates and money to strings", () => {
    expect(serializeSession(row, afterGrace)).toMatchObject({
      scheduledAt: "2026-01-01T10:00:00.000Z",
      durationHours: 1.5,
      startedAt: null,
      amountCharged: "150.50",
    });
  });

  test("UT-12 paymentPending needs both to have joined and the grace period to be over", () => {
    expect(serializeSession(row, afterGrace).paymentPending).toBe(true);
    expect(serializeSession(row, start).paymentPending).toBe(false);
    expect(serializeSession({ ...row, studentJoinedAt: null }, afterGrace).paymentPending).toBe(
      false
    );
    expect(
      serializeSession({ ...row, status: "completed" } as typeof row, afterGrace).paymentPending
    ).toBe(false);
  });
});

describe("top-up metadata", () => {
  const metadata: TopUpMetadata = {
    kind: "topup",
    version: 1,
    requestId: ID.request,
    balanceAfter: "100.00",
  };
  const transaction = (overrides: object = {}) =>
    ({
      id: transactionRequestId("topup", ID.user, ID.request),
      userId: ID.user,
      type: "topup",
      relatedSessionId: null,
      amount: new Prisma.Decimal(100),
      note: JSON.stringify(metadata),
      ...overrides,
    }) as never;

  test("UT-13 reads back what was serialized", () => {
    expect(JSON.parse(serializeTopUpMetadata(metadata))).toEqual(metadata);
    expect(readTopUpMetadata(transaction())).toEqual(metadata);
  });

  test("UT-14 refuses to serialize a bad balance", () => {
    expect(() => serializeTopUpMetadata({ ...metadata, balanceAfter: "100" })).toThrow();
  });

  test.each([
    ["wrong type", { type: "earning" }],
    ["linked to a session", { relatedSessionId: ID.session }],
    ["zero amount", { amount: new Prisma.Decimal(0) }],
    ["no note", { note: null }],
    ["note that is not JSON", { note: "{oops" }],
    ["extra metadata key", { note: JSON.stringify({ ...metadata, extra: 1 }) }],
    ["id from another request", { id: ID.other }],
  ])("UT-15 returns null for %s", (_label, overrides) => {
    expect(readTopUpMetadata(transaction(overrides))).toBeNull();
  });
});

describe("withdrawal metadata", () => {
  const metadata: WithdrawalMetadata = {
    kind: "withdrawal",
    version: 1,
    requestId: ID.request,
    requestFingerprint: "a".repeat(64),
    currency: "THB",
    status: "completed",
    destination: {
      bankCode: "KBANK",
      accountNumberMasked: "******7890",
      accountHolderName: "Somchai Jaidee",
    },
    balanceAfter: "50.00",
  };
  const transaction = (overrides: object = {}) =>
    ({
      id: withdrawalTransactionId(ID.user, ID.request),
      userId: ID.user,
      type: "withdrawal",
      relatedSessionId: null,
      amount: new Prisma.Decimal(50),
      note: JSON.stringify(metadata),
      ...overrides,
    }) as never;

  test("UT-16 reads back what was serialized", () => {
    expect(JSON.parse(serializeWithdrawalMetadata(metadata))).toEqual(metadata);
    expect(readWithdrawalMetadata(transaction())).toEqual(metadata);
  });

  test.each([
    ["an unmasked account number", { accountNumberMasked: "1234567890" }],
    ["an unsupported bank", { bankCode: "NOPE" }],
    ["a name with double spaces", { accountHolderName: "A  B" }],
  ])("UT-17 refuses to serialize %s", (_label, destination) => {
    expect(() =>
      serializeWithdrawalMetadata({
        ...metadata,
        destination: { ...metadata.destination, ...destination },
      } as WithdrawalMetadata)
    ).toThrow();
  });

  test.each([
    ["wrong type", { type: "topup" }],
    ["linked to a session", { relatedSessionId: ID.session }],
    ["negative amount", { amount: new Prisma.Decimal(-1) }],
    ["no note", { note: null }],
    ["note that is not JSON", { note: "nope" }],
    ["id from another request", { id: ID.other }],
  ])("UT-18 returns null for %s", (_label, overrides) => {
    expect(readWithdrawalMetadata(transaction(overrides))).toBeNull();
  });
});

describe("socket utils", () => {
  test("UT-19 room names round-trip through the prefix check", () => {
    expect(conversationRoomName("abc")).toBe("conversation:abc");
    expect(isConversationRoom("conversation:abc")).toBe(true);
    expect(isConversationRoom("socket-id")).toBe(false);
  });

  test("UT-20 connection errors carry their code in data", () => {
    const error = createSocketConnectionError("ACCOUNT_INACTIVE", "Inactive");

    expect(error.message).toBe("Inactive");
    expect(error.data).toEqual({ code: "ACCOUNT_INACTIVE" });
  });

  test("UT-21 ack failures have the failure shape", () => {
    expect(createSocketAckFailure("X", "m")).toEqual({ success: false, code: "X", message: "m" });
  });
});

describe("session scheduler", () => {
  test("UT-22 runs once at start and again every minute", async () => {
    jest.useFakeTimers();
    const run = jest.fn(async () => {});
    const scheduler = startSessionScheduler(run);
    await jest.advanceTimersByTimeAsync(0);
    expect(run).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(60_000);
    expect(run).toHaveBeenCalledTimes(2);
    await scheduler.stop();
  });

  test("UT-23 never overlaps a run that is still going", async () => {
    let finish!: () => void;
    const run = jest.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const scheduler = startSessionScheduler(run);
    await new Promise<void>((resolve) => setImmediate(resolve));

    void scheduler.tick();
    void scheduler.tick();
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(run).toHaveBeenCalledTimes(1);

    finish();
    await scheduler.stop();
  });

  test("UT-24 reports a failed run and keeps working", async () => {
    const onError = jest.fn();
    const failure = new Error("tick failed");
    const scheduler = startSessionScheduler(async () => {
      throw failure;
    }, onError);

    await scheduler.tick();
    expect(onError).toHaveBeenCalledWith(failure);
    await scheduler.stop();
  });

  test("UT-25 does nothing after stop", async () => {
    const run = jest.fn(async () => {});
    const scheduler = startSessionScheduler(run);
    await scheduler.stop();
    run.mockClear();

    await scheduler.tick();
    expect(run).not.toHaveBeenCalled();
  });
});
