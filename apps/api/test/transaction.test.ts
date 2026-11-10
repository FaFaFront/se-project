import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { serializeTopUpMetadata } from "../src/common/utils/top-up-metadata.js";
import { transactionRequestId } from "../src/common/utils/transaction-id.js";
import {
  serializeWithdrawalMetadata,
  withdrawalTransactionId,
} from "../src/common/utils/withdrawal-metadata.js";
import { transactionController } from "../src/controller/transaction.controller.js";
import { transactionRepository } from "../src/repository/transaction.repository.js";
import { userRepository } from "../src/repository/user.repository.js";
import { transactionService } from "../src/service/transaction.service.js";
import { callController, fakeTransaction, ID, restorePrisma } from "./helpers.js";

const createdAt = new Date("2026-01-01T00:00:00.000Z");

const topUpRow = (overrides: object = {}) => ({
  id: transactionRequestId("topup", ID.user, ID.request),
  userId: ID.user,
  type: "topup",
  amount: new Prisma.Decimal(100),
  relatedSessionId: null,
  createdAt,
  note: serializeTopUpMetadata({
    kind: "topup",
    version: 1,
    requestId: ID.request,
    balanceAfter: "100.00",
  }),
  ...overrides,
});

const fingerprint = "b".repeat(64);
const withdrawalRow = (overrides: object = {}) => ({
  id: withdrawalTransactionId(ID.user, ID.request),
  userId: ID.user,
  type: "withdrawal",
  amount: new Prisma.Decimal(50),
  relatedSessionId: null,
  createdAt,
  note: serializeWithdrawalMetadata({
    kind: "withdrawal",
    version: 1,
    requestId: ID.request,
    requestFingerprint: fingerprint,
    currency: "THB",
    status: "completed",
    destination: {
      bankCode: "KBANK",
      accountNumberMasked: "******7890",
      accountHolderName: "Somchai Jaidee",
    },
    balanceAfter: "50.00",
  }),
  ...overrides,
});

afterEach(() => {
  jest.restoreAllMocks();
  restorePrisma();
});

describe("transactionService history", () => {
  test("TX-01 lists with money as 2 decimals and hides internal notes", async () => {
    jest.spyOn(transactionRepository, "listOwned").mockResolvedValue({
      items: [
        topUpRow(),
        { ...topUpRow(), type: "earning", amount: new Prisma.Decimal(5), note: "visible" },
      ],
      total: 2,
    } as never);

    const result = await transactionService.list(ID.user, { page: 1, limit: 20 });

    expect(result.total).toBe(2);
    expect(result.items[0]).toMatchObject({ amount: "100.00", note: null });
    expect(result.items[1]).toMatchObject({ amount: "5.00", note: "visible" });
  });

  test("TX-02 get reports a missing transaction as 404", async () => {
    jest.spyOn(transactionRepository, "findOwned").mockResolvedValue(null);

    await expect(transactionService.get(ID.user, ID.other)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test("TX-03 get adds receipt details to a withdrawal without leaking the fingerprint", async () => {
    jest.spyOn(transactionRepository, "findOwned").mockResolvedValue(withdrawalRow() as never);

    const result = await transactionService.get(ID.user, ID.other);

    expect(result).toMatchObject({ currency: "THB", balanceAfter: "50.00", note: null });
    expect(JSON.stringify(result)).not.toContain(fingerprint);
  });

  test("TX-04 get adds the balance to a top-up", async () => {
    jest.spyOn(transactionRepository, "findOwned").mockResolvedValue(topUpRow() as never);

    expect(await transactionService.get(ID.user, ID.other)).toMatchObject({
      type: "topup",
      balanceAfter: "100.00",
    });
  });

  test("TX-05 get returns a plain transaction for other types", async () => {
    jest
      .spyOn(transactionRepository, "findOwned")
      .mockResolvedValue(topUpRow({ type: "earning", note: null }) as never);

    const result = await transactionService.get(ID.user, ID.other);

    expect(result).toMatchObject({ type: "earning" });
    expect(result).not.toHaveProperty("balanceAfter");
  });
});

describe("transactionService top-up", () => {
  test("TX-06 options are the 4 presets for a student", async () => {
    jest.spyOn(userRepository, "findRoleById").mockResolvedValue({ role: "student" });

    expect(await transactionService.getTopUpOptions(ID.user)).toEqual({
      topUpAmounts: [100, 300, 500, 1000],
    });
  });

  test.each([
    ["a tutor", { role: "tutor" }, 403],
    ["a deleted user", null, 401],
  ])("TX-07 options are refused for %s", async (_label, user, status) => {
    jest.spyOn(userRepository, "findRoleById").mockResolvedValue(user as never);

    await expect(transactionService.getTopUpOptions(ID.user)).rejects.toMatchObject({
      statusCode: status,
    });
  });

  test.each([
    ["missing-user", 401],
    ["forbidden", 403],
    ["balance-overflow", 400],
    ["conflict", 409],
  ])("TX-08 repository result %s becomes status %i", async (kind, status) => {
    jest.spyOn(transactionRepository, "submitTopUp").mockResolvedValue({ kind } as never);

    await expect(
      transactionService.submitTopUp(ID.user, { requestId: ID.request, amount: 100 })
    ).rejects.toMatchObject({ statusCode: status });
  });

  test("TX-09 success returns the receipt and replay flag", async () => {
    jest.spyOn(transactionRepository, "submitTopUp").mockResolvedValue({
      kind: "success",
      transaction: topUpRow(),
      replayed: true,
    } as never);

    const result = await transactionService.submitTopUp(ID.user, {
      requestId: ID.request,
      amount: 100,
    });

    expect(result?.replayed).toBe(true);
    expect(result?.data).toMatchObject({ type: "topup", balanceAfter: "100.00" });
  });
});

describe("transactionService withdrawal", () => {
  const passwordHash = bcrypt.hashSync("right", 4);
  const input = {
    requestId: ID.request,
    amount: 50,
    password: "right",
    bankCode: "KBANK" as const,
    accountNumber: "1234567890",
    accountHolderName: "Somchai Jaidee",
  };
  const asTutor = () =>
    jest
      .spyOn(userRepository, "findForPasswordVerification")
      .mockResolvedValue({ role: "tutor", passwordHash });

  test("TX-10 rejects a wrong confirmation password with 403 before touching money", async () => {
    asTutor();
    const submit = jest.spyOn(transactionRepository, "submitWithdrawal");

    await expect(
      transactionService.submitWithdrawal(ID.user, { ...input, password: "wrong" })
    ).rejects.toMatchObject({ statusCode: 403, message: "Incorrect confirmation password" });
    expect(submit).not.toHaveBeenCalled();
  });

  test.each([
    ["a student", { role: "student", passwordHash }, 403],
    ["a deleted user", null, 401],
  ])("TX-11 refuses %s", async (_label, user, status) => {
    jest.spyOn(userRepository, "findForPasswordVerification").mockResolvedValue(user as never);

    await expect(transactionService.submitWithdrawal(ID.user, input)).rejects.toMatchObject({
      statusCode: status,
    });
  });

  test("TX-12 masks the account number and never sends the full one to storage", async () => {
    asTutor();
    const submit = jest.spyOn(transactionRepository, "submitWithdrawal").mockResolvedValue({
      kind: "success",
      withdrawal: withdrawalRow(),
      replayed: false,
    } as never);

    await transactionService.submitWithdrawal(ID.user, input);

    const sent = submit.mock.calls[0][0];
    expect(sent.accountNumberMasked).toBe("******7890");
    expect(JSON.stringify(sent)).not.toContain("1234567890");
  });

  test("TX-13 fingerprint is stable for a retry and changes when details change", async () => {
    asTutor();
    const submit = jest.spyOn(transactionRepository, "submitWithdrawal").mockResolvedValue({
      kind: "success",
      withdrawal: withdrawalRow(),
      replayed: false,
    } as never);

    await transactionService.submitWithdrawal(ID.user, input);
    await transactionService.submitWithdrawal(ID.user, input);
    await transactionService.submitWithdrawal(ID.user, { ...input, accountNumber: "1234567899" });

    const [first, retry, changed] = submit.mock.calls.map((call) => call[0].requestFingerprint);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(retry).toBe(first);
    expect(changed).not.toBe(first);
  });

  test.each([
    ["missing-user", 401],
    ["forbidden", 403],
    ["password-changed", 403],
    ["conflict", 409],
    ["insufficient-balance", 400],
  ])("TX-14 repository result %s becomes status %i", async (kind, status) => {
    asTutor();
    jest.spyOn(transactionRepository, "submitWithdrawal").mockResolvedValue({ kind } as never);

    await expect(transactionService.submitWithdrawal(ID.user, input)).rejects.toMatchObject({
      statusCode: status,
    });
  });

  test("TX-15 looks up a retry by the id derived from the request", async () => {
    jest.spyOn(userRepository, "findRoleById").mockResolvedValue({ role: "tutor" });
    const findOwned = jest
      .spyOn(transactionRepository, "findOwned")
      .mockResolvedValue(withdrawalRow() as never);

    const result = await transactionService.getWithdrawalByRequest(ID.user, ID.request);

    expect(findOwned).toHaveBeenCalledWith(
      ID.user,
      withdrawalTransactionId(ID.user, ID.request),
      "withdrawal"
    );
    expect(result).toMatchObject({ type: "withdrawal" });
  });

  test("TX-16 lookup reports an unknown request as 404", async () => {
    jest.spyOn(userRepository, "findRoleById").mockResolvedValue({ role: "tutor" });
    jest.spyOn(transactionRepository, "findOwned").mockResolvedValue(null);

    await expect(
      transactionService.getWithdrawalByRequest(ID.user, ID.request)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("transactionController", () => {
  const student = { id: ID.user, role: "student" };
  const tutor = { id: ID.user, role: "tutor" };
  const withdrawal = {
    requestId: ID.request,
    amount: 50,
    password: "pw",
    bankCode: "KBANK",
    accountNumber: "1234567890",
    accountHolderName: "Somchai Jaidee",
  };

  test("TX-17 history defaults to page 1, limit 20 and is never cached", async () => {
    const list = jest.spyOn(transactionService, "list").mockResolvedValue({} as never);

    const { res } = await callController(transactionController.list as never, { user: student });

    expect(list).toHaveBeenCalledWith(ID.user, { page: 1, limit: 20 });
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });

  test.each([
    ["page 0", { page: "0" }],
    ["limit 101", { limit: "101" }],
    ["unknown type", { type: "gift" }],
    ["unknown key", { foo: "1" }],
  ])("TX-18 history rejects %s", async (_label, query) => {
    const { error } = await callController(transactionController.list as never, {
      user: student,
      query,
    });

    expect(error).toBeInstanceOf(ZodError);
  });

  test("TX-19 history needs a logged-in user", async () => {
    const { error } = await callController(transactionController.list as never);

    expect(error?.statusCode).toBe(401);
  });

  test("TX-20 options refuses a tutor", async () => {
    const { error } = await callController(transactionController.getTopUpOptions as never, {
      user: tutor,
    });

    expect(error?.statusCode).toBe(403);
  });

  test.each([
    ["a new top-up answers 201", false, 201],
    ["a replayed top-up answers 200", true, 200],
  ])("TX-21 %s", async (_label, replayed, status) => {
    jest
      .spyOn(transactionService, "submitTopUp")
      .mockResolvedValue({ data: {}, replayed } as never);

    const { res } = await callController(transactionController.topUp as never, {
      user: student,
      body: { requestId: ID.request, amount: 100 },
    });

    expect(res.status).toHaveBeenCalledWith(status);
  });

  test.each([[99], [100.5], [1001], [-100]])(
    "TX-22 top-up rejects non-preset amount %d",
    async (amount) => {
      const submit = jest.spyOn(transactionService, "submitTopUp");

      const { error } = await callController(transactionController.topUp as never, {
        user: student,
        body: { requestId: ID.request, amount },
      });

      expect(error?.message).toContain("preset amount");
      expect(submit).not.toHaveBeenCalled();
    }
  );

  test("TX-23 top-up refuses a tutor before validating", async () => {
    const { error } = await callController(transactionController.topUp as never, {
      user: tutor,
      body: {},
    });

    expect(error?.statusCode).toBe(403);
  });

  test("TX-24 top-up lowercases the request id", async () => {
    const submit = jest
      .spyOn(transactionService, "submitTopUp")
      .mockResolvedValue({ data: {}, replayed: false } as never);
    const requestId = "ABCDEF12-1111-4111-8111-111111111111";

    await callController(transactionController.topUp as never, {
      user: student,
      body: { requestId, amount: 100 },
    });

    expect(submit.mock.calls[0][1].requestId).toBe(requestId.toLowerCase());
  });

  test("TX-25 withdrawal cleans the account number and the name", async () => {
    const submit = jest
      .spyOn(transactionService, "submitWithdrawal")
      .mockResolvedValue({ data: {}, replayed: false } as never);

    const { res } = await callController(transactionController.withdraw as never, {
      user: tutor,
      body: { ...withdrawal, accountNumber: " 123-456 7890 ", accountHolderName: " A   B " },
    });

    expect(submit.mock.calls[0][1]).toMatchObject({
      accountNumber: "1234567890",
      accountHolderName: "A B",
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test.each([
    ["zero amount", { amount: 0 }, "greater than zero"],
    ["three decimals", { amount: 1.234 }, "two decimal"],
    ["too large", { amount: 10_000_000_000 }, "precision"],
    ["no password", { password: "" }, "password is required"],
    ["unknown bank", { bankCode: "NOPE" }, "supported Thai bank"],
    ["5 digit account", { accountNumber: "12345" }, "6 to 20 digits"],
    ["21 digit account", { accountNumber: "1".repeat(21) }, "6 to 20 digits"],
    ["letters in account", { accountNumber: "12345a7890" }, "6 to 20 digits"],
    ["blank name", { accountHolderName: "  " }, "holder name is required"],
    ["bad request id", { requestId: "nope" }, "must be a UUID"],
  ])("TX-26 withdrawal rejects %s", async (_label, change, message) => {
    const submit = jest.spyOn(transactionService, "submitWithdrawal");

    const { error } = await callController(transactionController.withdraw as never, {
      user: tutor,
      body: { ...withdrawal, ...change },
    });

    expect(error).toBeInstanceOf(ZodError);
    expect(error?.message).toContain(message);
    expect(submit).not.toHaveBeenCalled();
  });

  test("TX-27 withdrawal refuses a student", async () => {
    const { error } = await callController(transactionController.withdraw as never, {
      user: student,
      body: withdrawal,
    });

    expect(error?.statusCode).toBe(403);
  });

  test("TX-28 withdrawal lookup and transaction get reject bad ids", async () => {
    const lookup = await callController(transactionController.getWithdrawalByRequest as never, {
      user: tutor,
      params: { requestId: "nope" },
    });
    const get = await callController(transactionController.get as never, {
      user: tutor,
      params: { id: "nope" },
    });

    expect(lookup.error).toBeInstanceOf(ZodError);
    expect(get.error).toBeInstanceOf(ZodError);
  });

  test("TX-29 transaction get returns the service result", async () => {
    jest.spyOn(transactionService, "get").mockResolvedValue({ id: "x" } as never);

    const { body, res } = await callController(transactionController.get as never, {
      user: tutor,
      params: { id: ID.other },
    });

    expect(body.data).toEqual({ id: "x" });
    expect(res.set).toHaveBeenCalledWith("Cache-Control", "no-store");
  });
});

describe("transactionRepository.submitTopUp", () => {
  const amount = new Prisma.Decimal(100);
  const lockedUser = (user: object | null) => jest.fn(async () => (user ? [user] : []));
  const run = () =>
    transactionRepository.submitTopUp({ userId: ID.user, requestId: ID.request, amount });

  test("TR-01 credits the wallet and records the balance after", async () => {
    const update = jest.fn(async (_args: object) => ({ walletBalance: new Prisma.Decimal("150") }));
    const create = jest.fn(async (args: { data: { note: string } }) => args.data);
    fakeTransaction({
      $queryRaw: lockedUser({ role: "student", walletBalance: new Prisma.Decimal(50) }),
      transaction: { findUnique: jest.fn(async () => null), create },
      user: { update },
    });

    const result = await run();

    expect(result.kind).toBe("success");
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { walletBalance: { increment: amount } } })
    );
    expect(JSON.parse(create.mock.calls[0][0].data.note).balanceAfter).toBe("150.00");
  });

  test("TR-02 a retry returns the first result without charging again", async () => {
    const update = jest.fn();
    fakeTransaction({
      $queryRaw: lockedUser({ role: "student", walletBalance: new Prisma.Decimal(50) }),
      transaction: { findUnique: jest.fn(async () => topUpRow()) },
      user: { update },
    });

    expect(await run()).toMatchObject({ kind: "success", replayed: true });
    expect(update).not.toHaveBeenCalled();
  });

  test("TR-03 reusing a request id with another amount is a conflict", async () => {
    const update = jest.fn();
    fakeTransaction({
      $queryRaw: lockedUser({ role: "student", walletBalance: new Prisma.Decimal(50) }),
      transaction: {
        findUnique: jest.fn(async () => topUpRow({ amount: new Prisma.Decimal(300) })),
      },
      user: { update },
    });

    expect(await run()).toEqual({ kind: "conflict" });
    expect(update).not.toHaveBeenCalled();
  });

  test.each([
    ["a missing user", null, "missing-user"],
    ["a tutor", { role: "tutor", walletBalance: new Prisma.Decimal(0) }, "forbidden"],
    [
      "a balance over the limit",
      { role: "student", walletBalance: new Prisma.Decimal("9999999999.99") },
      "balance-overflow",
    ],
  ])("TR-04 refuses %s", async (_label, user, kind) => {
    fakeTransaction({
      $queryRaw: lockedUser(user),
      transaction: { findUnique: jest.fn(async () => null) },
    });

    expect(await run()).toEqual({ kind });
  });
});

describe("transactionRepository.submitWithdrawal", () => {
  const input = {
    userId: ID.user,
    requestId: ID.request,
    requestFingerprint: fingerprint,
    passwordHash: "hash",
    amount: new Prisma.Decimal(50),
    bankCode: "KBANK" as const,
    accountNumberMasked: "******7890",
    accountHolderName: "Somchai Jaidee",
  };
  const tutorLock = jest.fn(async () => [{ role: "tutor", passwordHash: "hash" }]);

  test("TR-05 debits only when the balance covers it and records the receipt", async () => {
    const updateMany = jest.fn(async (_args: object) => ({ count: 1 }));
    const create = jest.fn(async (args: { data: { note: string } }) => args.data);
    fakeTransaction({
      $queryRaw: tutorLock,
      transaction: { findUnique: jest.fn(async () => null), create },
      user: {
        updateMany,
        findUniqueOrThrow: jest.fn(async () => ({ walletBalance: new Prisma.Decimal(25) })),
      },
    });

    const result = await transactionRepository.submitWithdrawal(input);

    expect(result.kind).toBe("success");
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: ID.user, role: "tutor", walletBalance: { gte: input.amount } },
      data: { walletBalance: { decrement: input.amount } },
    });
    expect(JSON.parse(create.mock.calls[0][0].data.note).balanceAfter).toBe("25.00");
  });

  test("TR-06 reports insufficient balance and records nothing", async () => {
    const create = jest.fn();
    fakeTransaction({
      $queryRaw: tutorLock,
      transaction: { findUnique: jest.fn(async () => null), create },
      user: { updateMany: jest.fn(async () => ({ count: 0 })) },
    });

    expect(await transactionRepository.submitWithdrawal(input)).toEqual({
      kind: "insufficient-balance",
    });
    expect(create).not.toHaveBeenCalled();
  });

  test("TR-07 a retry with the same details is not debited again", async () => {
    const updateMany = jest.fn();
    fakeTransaction({
      $queryRaw: tutorLock,
      transaction: { findUnique: jest.fn(async () => withdrawalRow()) },
      user: { updateMany },
    });

    expect(await transactionRepository.submitWithdrawal(input)).toMatchObject({
      kind: "success",
      replayed: true,
    });
    expect(updateMany).not.toHaveBeenCalled();
  });

  test("TR-08 a retry with different details is a conflict", async () => {
    fakeTransaction({
      $queryRaw: tutorLock,
      transaction: { findUnique: jest.fn(async () => withdrawalRow()) },
    });

    expect(
      await transactionRepository.submitWithdrawal({
        ...input,
        requestFingerprint: "c".repeat(64),
      })
    ).toEqual({ kind: "conflict" });
  });

  test.each([
    ["a missing user", [], "missing-user"],
    ["a student", [{ role: "student", passwordHash: "hash" }], "forbidden"],
    ["a changed password", [{ role: "tutor", passwordHash: "new" }], "password-changed"],
  ])("TR-09 refuses %s", async (_label, rows, kind) => {
    fakeTransaction({ $queryRaw: jest.fn(async () => rows) });

    expect(await transactionRepository.submitWithdrawal(input)).toEqual({ kind });
  });
});

describe("transactionRepository.settleSession", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");
  const session = (overrides: object = {}) => ({
    id: ID.session,
    classroomId: ID.classroom,
    attendanceTrackingEnabled: true,
    status: "ongoing",
    scheduledAt: new Date("2026-01-01T10:00:00.000Z"),
    durationHours: new Prisma.Decimal("1.5"),
    tutorJoinedAt: now,
    studentJoinedAt: now,
    classroom: {
      studentId: ID.student,
      tutorId: ID.tutor,
      pricePerHour: new Prisma.Decimal("100.33"),
    },
    ...overrides,
  });

  function setup({
    row = session() as object | null,
    studentBalance = "1000",
    tutorBalance = "0",
    debitCount = 1,
  } = {}) {
    const meetUpdate = jest.fn(async (_args: object) => ({}));
    const updateMany = jest.fn(async (_args: object) => ({ count: debitCount }));
    const userUpdate = jest.fn(async (_args: object) => ({}));
    const createMany = jest.fn(async (_args: { data: object[] }) => ({ count: 2 }));
    fakeTransaction({
      meetSession: {
        findUnique: jest.fn(async () => row),
        update: meetUpdate,
      },
      user: {
        findUniqueOrThrow: jest.fn(async ({ where }: { where: { id: string } }) => ({
          walletBalance: new Prisma.Decimal(
            where.id === ID.student ? studentBalance : tutorBalance
          ),
        })),
        updateMany,
        update: userUpdate,
      },
      transaction: { createMany },
    });
    return { meetUpdate, updateMany, userUpdate, createMany };
  }
  const settle = () => transactionRepository.settleSession(ID.session, now);

  test("TR-10 charges the student, pays the tutor and completes the session", async () => {
    const { meetUpdate, updateMany, userUpdate, createMany } = setup();
    const amount = new Prisma.Decimal("150.50");

    expect(await settle()).toEqual({ kind: "completed" });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: ID.student, walletBalance: { gte: amount } },
      data: { walletBalance: { decrement: amount } },
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { id: ID.tutor },
      data: { walletBalance: { increment: amount } },
    });
    expect(createMany.mock.calls[0][0].data).toEqual([
      expect.objectContaining({ userId: ID.student, type: "session_charge", amount }),
      expect.objectContaining({ userId: ID.tutor, type: "earning", amount }),
    ]);
    expect(meetUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "completed" }) })
    );
  });

  test("TR-11 rounds the charge half up to 2 decimals (100.33 x 1.5 = 150.50)", async () => {
    const { createMany } = setup();

    await settle();

    expect(String((createMany.mock.calls[0][0].data[0] as { amount: unknown }).amount)).toBe(
      "150.5"
    );
  });

  test.each([
    ["the tutor", { tutorJoinedAt: null }],
    ["the student", { studentJoinedAt: null }],
  ])("TR-12 marks the session missed and charges nobody if %s did not join", async (_l, change) => {
    const { meetUpdate, updateMany } = setup({ row: session(change) });

    expect(await settle()).toEqual({ kind: "missed" });
    expect(updateMany).not.toHaveBeenCalled();
    expect(meetUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "missed", amountCharged: 0 }),
      })
    );
  });

  test("TR-13 leaves the session unpaid when the student can't afford it", async () => {
    const { updateMany, createMany } = setup({ studentBalance: "150.49" });

    expect(await settle()).toEqual({ kind: "insufficient-balance" });
    expect(updateMany).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });

  test("TR-14 charges when the balance is exactly enough", async () => {
    setup({ studentBalance: "150.50" });

    expect(await settle()).toEqual({ kind: "completed" });
  });

  test.each([
    ["a missing session", null],
    ["tracking turned off", session({ attendanceTrackingEnabled: false })],
    ["a session already completed", session({ status: "completed" })],
    ["a session not yet due", session({ scheduledAt: new Date("2026-01-01T11:00:00.000Z") })],
  ])("TR-15 skips %s", async (_label, row) => {
    const { updateMany } = setup({ row });

    expect(await settle()).toEqual({ kind: "skipped" });
    expect(updateMany).not.toHaveBeenCalled();
  });

  test("TR-16 fails if the balance changed mid-settlement, so the transaction rolls back", async () => {
    setup({ debitCount: 0 });

    await expect(settle()).rejects.toThrow("Student balance changed during settlement");
  });

  test("TR-17 fails if the tutor's wallet would overflow", async () => {
    const { updateMany } = setup({ tutorBalance: "9999999999.99" });

    await expect(settle()).rejects.toThrow("Tutor wallet would exceed supported balance");
    expect(updateMany).not.toHaveBeenCalled();
  });
});
