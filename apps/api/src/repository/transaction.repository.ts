import { lockSession } from "../common/db/session.js";
import { scheduledEnd, settlementDue } from "../common/utils/session.js";
import { Prisma, type TransactionType } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import {
  readWithdrawalMetadata,
  serializeWithdrawalMetadata,
  withdrawalTransactionId,
  type WithdrawalMetadata,
} from "../common/utils/withdrawal-metadata.js";
import { readTopUpMetadata, serializeTopUpMetadata } from "../common/utils/top-up-metadata.js";
import { transactionRequestId } from "../common/utils/transaction-id.js";

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

export const transactionRepository = {
  async settleSession(id: string, now: Date) {
    return prisma.$transaction(
      async (tx) => {
        const candidate = await tx.meetSession.findUnique({
          where: { id },
          select: { classroomId: true },
        });
        if (!candidate) return { kind: "skipped" } as const;
        // Lock order: classroom -> session -> wallets in sorted user-ID order.
        // Holding the classroom lock keeps an editable hourly rate stable through commit.
        await tx.$queryRaw`SELECT "id" FROM "classrooms" WHERE "id" = ${candidate.classroomId} FOR UPDATE`;
        await lockSession(tx, id);
        const session = await tx.meetSession.findUnique({
          where: { id },
          include: { classroom: true },
        });
        if (
          !session ||
          !session.attendanceTrackingEnabled ||
          session.status !== "ongoing" ||
          !settlementDue(session, now)
        )
          return { kind: "skipped" } as const;
        const endedAt = scheduledEnd(session);
        if (!session.tutorJoinedAt || !session.studentJoinedAt) {
          await tx.meetSession.update({
            where: { id, status: "ongoing" },
            data: { status: "missed", amountCharged: 0, endedAt },
          });
          return { kind: "missed" } as const;
        }

        const { studentId, tutorId, pricePerHour } = session.classroom;
        const amount = pricePerHour
          .mul(session.durationMinutes)
          .div(60)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        if (amount.lte(0) || amount.gt("9999999999.99"))
          throw new Error("Session charge exceeds the supported positive amount");
        for (const userId of [studentId, tutorId].sort()) {
          await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${userId} FOR UPDATE`;
        }
        const student = await tx.user.findUniqueOrThrow({
          where: { id: studentId },
          select: { walletBalance: true },
        });
        const tutor = await tx.user.findUniqueOrThrow({
          where: { id: tutorId },
          select: { walletBalance: true },
        });
        if (student.walletBalance.lt(amount)) return { kind: "insufficient-balance" } as const;
        if (tutor.walletBalance.plus(amount).gt("9999999999.99"))
          throw new Error("Tutor wallet would exceed supported balance");

        const debit = await tx.user.updateMany({
          where: { id: studentId, walletBalance: { gte: amount } },
          data: { walletBalance: { decrement: amount } },
        });
        if (debit.count !== 1) throw new Error("Student balance changed during settlement");
        await tx.user.update({
          where: { id: tutorId },
          data: { walletBalance: { increment: amount } },
        });
        await tx.transaction.createMany({
          data: [
            {
              id: transactionRequestId("session_charge", studentId, id),
              userId: studentId,
              type: "session_charge",
              amount,
              relatedSessionId: id,
            },
            {
              id: transactionRequestId("earning", tutorId, id),
              userId: tutorId,
              type: "earning",
              amount,
              relatedSessionId: id,
            },
          ],
        });
        await tx.meetSession.update({
          where: { id, status: "ongoing" },
          data: { status: "completed", endedAt, amountCharged: amount },
        });
        return { kind: "completed" } as const;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10_000,
        timeout: 15_000,
      }
    );
  },

  findOwned(userId: string, id: string, type?: TransactionType) {
    return prisma.transaction.findFirst({ where: { id, userId, ...(type && { type }) } });
  },

  async listOwned(userId: string, input: { page: number; limit: number; type?: TransactionType }) {
    const where = { userId, ...(input.type && { type: input.type }) };
    const [items, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      }),
      prisma.transaction.count({ where }),
    ]);
    return { items, total };
  },

  submitTopUp(input: { userId: string; requestId: string; amount: Prisma.Decimal }) {
    return prisma.$transaction(
      async (tx) => {
        const users = await tx.$queryRaw<{ role: string; walletBalance: Prisma.Decimal }[]>`
        SELECT "role", "walletBalance" FROM "users" WHERE "id" = ${input.userId} FOR UPDATE
      `;
        const user = users[0];
        if (!user) return { kind: "missing-user" } as const;
        if (user.role !== "student") return { kind: "forbidden" } as const;

        const id = transactionRequestId("topup", input.userId, input.requestId);
        const existing = await tx.transaction.findUnique({ where: { id } });
        if (existing) {
          const metadata = readTopUpMetadata(existing);
          if (
            existing.userId !== input.userId ||
            !metadata ||
            metadata.requestId !== input.requestId ||
            !existing.amount.equals(input.amount)
          ) {
            return { kind: "conflict" } as const;
          }
          return { kind: "success", transaction: existing, replayed: true } as const;
        }

        if (
          new Prisma.Decimal(user.walletBalance).plus(input.amount).greaterThan("9999999999.99")
        ) {
          return { kind: "balance-overflow" } as const;
        }
        const wallet = await tx.user.update({
          where: { id: input.userId },
          data: { walletBalance: { increment: input.amount } },
          select: { walletBalance: true },
        });
        const transaction = await tx.transaction.create({
          data: {
            id,
            userId: input.userId,
            type: "topup",
            amount: input.amount,
            note: serializeTopUpMetadata({
              kind: "topup",
              version: 1,
              requestId: input.requestId,
              balanceAfter: wallet.walletBalance.toFixed(2),
            }),
          },
        });
        return { kind: "success", transaction, replayed: false } as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );
  },

  submitWithdrawal(input: WithdrawalInput) {
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
