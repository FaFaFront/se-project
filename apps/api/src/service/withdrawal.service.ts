import { createHmac } from "node:crypto";
import { Prisma, type Transaction } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../common/errors/app-error.js";
import { env } from "../config/env.js";
import { withdrawalRepository } from "../repository/withdrawal.repository.js";
import {
  readWithdrawalMetadata,
  type WithdrawalMetadata,
} from "../common/utils/withdrawal-metadata.js";

type SubmitWithdrawal = {
  requestId: string;
  amount: number;
  password: string;
  bankCode: WithdrawalMetadata["destination"]["bankCode"];
  accountNumber: string;
  accountHolderName: string;
};

function present(withdrawal: Transaction) {
  const metadata = readWithdrawalMetadata(withdrawal);
  if (!metadata) throw new NotFoundError("Withdrawal not found");
  return {
    id: withdrawal.id,
    amount: withdrawal.amount.toFixed(2),
    currency: metadata.currency,
    status: metadata.status,
    destination: metadata.destination,
    requestedAt: withdrawal.createdAt,
    completedAt: withdrawal.createdAt,
    balanceAfter: metadata.balanceAfter,
  };
}

async function requireTutor(userId: string) {
  const user = await withdrawalRepository.findUser(userId);
  if (!user) throw new UnauthorizedError("User no longer exists");
  if (user.role !== "tutor") throw new ForbiddenError("Only tutors can withdraw balance");
  return user;
}

export const withdrawalService = {
  async submit(userId: string, input: SubmitWithdrawal) {
    const user = await requireTutor(userId);
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

    const result = await withdrawalRepository.submit({
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
        return { data: present(result.withdrawal), replayed: result.replayed };
    }
  },

  async get(userId: string, id: string) {
    await requireTutor(userId);
    const withdrawal = await withdrawalRepository.findOwned(userId, id);
    if (!withdrawal) throw new NotFoundError("Withdrawal not found");
    return present(withdrawal);
  },
};
