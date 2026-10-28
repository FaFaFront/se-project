import { createHmac } from "node:crypto";
import { Prisma, type Transaction, type TransactionType } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../common/errors/app-error.js";
import { env } from "../config/env.js";
import { transactionRepository } from "../repository/transaction.repository.js";
import { userRepository } from "../repository/user.repository.js";
import {
  readWithdrawalMetadata,
  withdrawalTransactionId,
  type WithdrawalMetadata,
} from "../common/utils/withdrawal-metadata.js";
import { readTopUpMetadata } from "../common/utils/top-up-metadata.js";

export const TOP_UP_AMOUNTS = [100, 300, 500, 1000] as const;

type SubmitWithdrawal = {
  requestId: string;
  amount: number;
  password: string;
  bankCode: WithdrawalMetadata["destination"]["bankCode"];
  accountNumber: string;
  accountHolderName: string;
};

function presentTransaction(transaction: Transaction) {
  return {
    id: transaction.id,
    userId: transaction.userId,
    type: transaction.type,
    amount: transaction.amount.toFixed(2),
    relatedSessionId: transaction.relatedSessionId,
    // Versioned operation metadata is internal; expose only explicit receipt fields.
    note: ["withdrawal", "topup"].includes(transaction.type) ? null : transaction.note,
    createdAt: transaction.createdAt,
  };
}

function presentWithdrawal(withdrawal: Transaction) {
  const metadata = readWithdrawalMetadata(withdrawal);
  if (!metadata) throw new NotFoundError("Withdrawal not found");
  return {
    ...presentTransaction(withdrawal),
    type: "withdrawal" as const,
    currency: metadata.currency,
    status: metadata.status,
    destination: metadata.destination,
    requestedAt: withdrawal.createdAt,
    completedAt: withdrawal.createdAt,
    balanceAfter: metadata.balanceAfter,
  };
}

function presentTopUp(transaction: Transaction) {
  const metadata = readTopUpMetadata(transaction);
  if (!metadata) throw new NotFoundError("Top-up not found");
  return {
    ...presentTransaction(transaction),
    type: "topup" as const,
    balanceAfter: metadata.balanceAfter,
  };
}

function requireTutor<T extends { role: string }>(user: T | null): T {
  if (!user) throw new UnauthorizedError("User no longer exists");
  if (user.role !== "tutor") throw new ForbiddenError("Only tutors can withdraw balance");
  return user;
}

export const transactionService = {
  async list(userId: string, input: { page: number; limit: number; type?: TransactionType }) {
    const { items, total } = await transactionRepository.listOwned(userId, input);
    return { items: items.map(presentTransaction), page: input.page, limit: input.limit, total };
  },

  async get(userId: string, id: string) {
    const transaction = await transactionRepository.findOwned(userId, id);
    if (!transaction) throw new NotFoundError("Transaction not found");
    if (readWithdrawalMetadata(transaction)) return presentWithdrawal(transaction);
    if (readTopUpMetadata(transaction)) return presentTopUp(transaction);
    return presentTransaction(transaction);
  },

  async getTopUpOptions(userId: string) {
    const user = await userRepository.findRoleById(userId);
    if (!user) throw new UnauthorizedError("User no longer exists");
    if (user.role !== "student") throw new ForbiddenError("Only students can access top-ups");
    return { topUpAmounts: TOP_UP_AMOUNTS };
  },

  async submitTopUp(userId: string, input: { requestId: string; amount: number }) {
    const result = await transactionRepository.submitTopUp({
      userId,
      requestId: input.requestId,
      amount: new Prisma.Decimal(input.amount),
    });
    switch (result.kind) {
      case "missing-user":
        throw new UnauthorizedError("User no longer exists");
      case "forbidden":
        throw new ForbiddenError("Only students can access top-ups");
      case "balance-overflow":
        throw new BadRequestError("Top-up would exceed the supported balance");
      case "conflict":
        throw new ConflictError(
          "Request ID was already used for different or incompatible top-up details"
        );
      case "success":
        return { data: presentTopUp(result.transaction), replayed: result.replayed };
    }
  },

  async getWithdrawalByRequest(userId: string, requestId: string) {
    requireTutor(await userRepository.findRoleById(userId));
    const withdrawal = await transactionRepository.findOwned(
      userId,
      withdrawalTransactionId(userId, requestId),
      "withdrawal"
    );
    if (!withdrawal) throw new NotFoundError("Withdrawal not found");
    return presentWithdrawal(withdrawal);
  },
  async submitWithdrawal(userId: string, input: SubmitWithdrawal) {
    const user = requireTutor(await userRepository.findForPasswordVerification(userId));
    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new ForbiddenError("Incorrect confirmation password");
    }

    const amount = new Prisma.Decimal(input.amount);
    // Domain-separated HMAC avoids storing the full account number or a guessable plain hash.
    // The secret must remain stable for retries (see withdrawal API documentation).
    const requestFingerprint = createHmac("sha256", env.JWT_SECRET)
      .update(
        JSON.stringify([
          "withdrawal-v1",
          userId,
          amount.toFixed(2),
          "THB",
          input.bankCode,
          input.accountNumber,
          input.accountHolderName,
        ])
      )
      .digest("hex");

    const result = await transactionRepository.submitWithdrawal({
      userId,
      requestId: input.requestId,
      requestFingerprint,
      passwordHash: user.passwordHash,
      amount,
      bankCode: input.bankCode,
      accountNumberMasked:
        "*".repeat(input.accountNumber.length - 4) + input.accountNumber.slice(-4),
      accountHolderName: input.accountHolderName,
    });

    switch (result.kind) {
      case "missing-user":
        throw new UnauthorizedError("User no longer exists");
      case "forbidden":
        throw new ForbiddenError("Only tutors can withdraw balance");
      case "password-changed":
        throw new ForbiddenError("Password changed; please confirm again");
      case "conflict":
        throw new ConflictError(
          "Request ID was already used for different or incompatible withdrawal details"
        );
      case "insufficient-balance":
        throw new BadRequestError("Insufficient available balance");
      case "success":
        return { data: presentWithdrawal(result.withdrawal), replayed: result.replayed };
    }
  },
};
