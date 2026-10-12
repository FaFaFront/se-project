import { createHash } from "node:crypto";
import type { Transaction } from "@prisma/client";
import { z } from "zod";

// Supported mock destinations, not bank ownership or bank-specific account verification.
export const THAI_BANK_CODES = [
  "BBL",
  "KBANK",
  "KTB",
  "SCB",
  "BAY",
  "TTB",
  "GSB",
  "BAAC",
  "GHB",
  "KKP",
  "TISCO",
  "CIMBT",
  "UOB",
] as const;

const metadataSchema = z
  .object({
    kind: z.literal("withdrawal"),
    version: z.literal(1),
    requestId: z
      .string()
      .uuid()
      .regex(/^[0-9a-f-]+$/),
    requestFingerprint: z.string().regex(/^[0-9a-f]{64}$/),
    currency: z.literal("THB"),
    status: z.literal("completed"),
    destination: z
      .object({
        bankCode: z.enum(THAI_BANK_CODES),
        accountNumberMasked: z.string().regex(/^\*{2,16}\d{4}$/),
        accountHolderName: z
          .string()
          .min(1)
          .max(100)
          .refine((name) => name === name.trim().replace(/\s+/g, " ")),
      })
      .strict(),
    balanceAfter: z.string().regex(/^(0|[1-9]\d{0,9})\.\d{2}$/),
  })
  .strict();

export type WithdrawalMetadata = z.infer<typeof metadataSchema>;

// UUIDv5 with the fixed standard URL namespace. No secret or amount in the ID:
// changing details must collide with the original request, never create another debit.
export function withdrawalTransactionId(userId: string, requestId: string): string {
  const namespace = Buffer.from("6ba7b8119dad11d180b400c04fd430c8", "hex");
  const hash = createHash("sha1")
    .update(namespace)
    .update(`tutorist:withdrawal:${userId}:${requestId.toLowerCase()}`, "utf8")
    .digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function serializeWithdrawalMetadata(metadata: WithdrawalMetadata): string {
  return JSON.stringify(metadataSchema.parse(metadata));
}

export function readWithdrawalMetadata(transaction: Transaction): WithdrawalMetadata | null {
  if (
    transaction.type !== "withdrawal" ||
    transaction.relatedSessionId !== null ||
    !transaction.amount.greaterThan(0) ||
    transaction.note === null
  )
    return null;
  try {
    const result = metadataSchema.safeParse(JSON.parse(transaction.note));
    if (
      !result.success ||
      transaction.id !== withdrawalTransactionId(transaction.userId, result.data.requestId)
    ) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}
