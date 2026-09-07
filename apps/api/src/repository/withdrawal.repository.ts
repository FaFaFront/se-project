import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  readWithdrawalMetadata,
  serializeWithdrawalMetadata,
  withdrawalTransactionId,
  type WithdrawalMetadata,
} from "../common/utils/withdrawal-metadata.js";

type WithdrawalInput = {
  userId: string;
  requestId: string;
  requestFingerprint: string;
  passwordHash: string;
  amount: Prisma.Decimal;
  bankCode: WithdrawalMetadata["destination"]["bankCode"];
  accountNumberMasked: string;
  accountHolderName: string;
};

export const withdrawalRepository = {
  findUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, passwordHash: true },
    });
  },

  findOwned(userId: string, id: string) {
    return prisma.transaction.findFirst({ where: { id, userId, type: "withdrawal" } });
  },

  submit(input: WithdrawalInput) {
    return prisma.$transaction(
      async (tx) => {
        // Serialize requests for this wallet before checking idempotency or balance.
        // Parameterized SQL; the lock also coordinates with other wallet updates.
        const users = await tx.$queryRaw<{ role: string; passwordHash: string }[]>`
        SELECT "role", "passwordHash" FROM "users" WHERE "id" = ${input.userId} FOR UPDATE
      `;
        const user = users[0];
        if (!user) return { kind: "missing-user" } as const;
        if (user.role !== "tutor") return { kind: "forbidden" } as const;
        if (user.passwordHash !== input.passwordHash) return { kind: "password-changed" } as const;

        const id = withdrawalTransactionId(input.userId, input.requestId);
        const existing = await tx.transaction.findUnique({ where: { id } });
        if (existing) {
          const metadata = readWithdrawalMetadata(existing);
          if (
            existing.userId !== input.userId ||
            !metadata ||
            metadata.requestId !== input.requestId ||
            metadata.requestFingerprint !== input.requestFingerprint ||
            !existing.amount.equals(input.amount)
          ) {
            return { kind: "conflict" } as const;
          }
          return { kind: "success", withdrawal: existing, replayed: true } as const;
        }

        const updated = await tx.user.updateMany({
          where: { id: input.userId, role: "tutor", walletBalance: { gte: input.amount } },
          data: { walletBalance: { decrement: input.amount } },
        });
        if (updated.count !== 1) return { kind: "insufficient-balance" } as const;

        const wallet = await tx.user.findUniqueOrThrow({
          where: { id: input.userId },
          select: { walletBalance: true },
        });
        const withdrawal = await tx.transaction.create({
          data: {
            id,
            userId: input.userId,
            type: "withdrawal",
            amount: input.amount,
            relatedSessionId: null,
            note: serializeWithdrawalMetadata({
              kind: "withdrawal",
              version: 1,
              requestId: input.requestId,
              requestFingerprint: input.requestFingerprint,
              currency: "THB",
              status: "completed",
              balanceAfter: wallet.walletBalance.toFixed(2),
              destination: {
                bankCode: input.bankCode,
                accountNumberMasked: input.accountNumberMasked,
                accountHolderName: input.accountHolderName,
              },
            }),
          },
        });
        return { kind: "success", withdrawal, replayed: false } as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );
  },
};
