import { jest } from "@jest/globals";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/config/prisma.js";

export const ID = {
  user: "11111111-1111-4111-8111-111111111111",
  other: "22222222-2222-4222-8222-222222222222",
  tutor: "33333333-3333-4333-8333-333333333333",
  student: "44444444-4444-4444-8444-444444444444",
  classroom: "55555555-5555-4555-8555-555555555555",
  session: "66666666-6666-4666-8666-666666666666",
  subject: "77777777-7777-4777-8777-777777777777",
  conversation: "88888888-8888-4888-8888-888888888888",
  request: "99999999-9999-4999-8999-999999999999",
};

export function knownPrismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

/** Runs a controller handler against a fake response and reports what it did. */
export async function callController(
  handler: (req: never, res: never, next: never) => Promise<void>,
  req: Record<string, unknown> = {}
) {
  const res = {
    set: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const next = jest.fn();
  await handler(
    { headers: {}, params: {}, query: {}, is: () => true, ...req } as never,
    res as never,
    next as never
  );
  return {
    res,
    body: res.json.mock.calls[0]?.[0] as { success: boolean; message: string; data: unknown },
    error: next.mock.calls[0]?.[0] as (Error & { statusCode?: number }) | undefined,
  };
}

const swapped = new Map<string, unknown>();

// Prisma's delegates are proxies that jest.spyOn can't patch, so whole properties are swapped.
export function fakePrisma(fakes: Record<string, unknown>) {
  const client = prisma as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(fakes)) {
    if (!swapped.has(key)) swapped.set(key, client[key]);
    Object.defineProperty(prisma, key, { value, configurable: true, writable: true });
  }
}

export function restorePrisma() {
  for (const [key, value] of swapped) {
    Object.defineProperty(prisma, key, { value, configurable: true, writable: true });
  }
  swapped.clear();
}

/** Makes prisma.$transaction(fn) run fn against the given fake transaction client. */
export function fakeTransaction<T extends Record<string, unknown>>(tx: T) {
  const client = { $queryRaw: jest.fn(async () => [] as unknown[]), ...tx };
  fakePrisma({ $transaction: async (run: (t: unknown) => unknown) => run(client) });
  return client;
}
