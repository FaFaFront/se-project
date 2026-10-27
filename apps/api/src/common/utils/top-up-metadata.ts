import type { Transaction } from "@prisma/client";
import { z } from "zod";
import { transactionRequestId } from "./transaction-id.js";

const metadataSchema = z
  .object({
    kind: z.literal("topup"),
    version: z.literal(1),
    requestId: z
      .string()
      .uuid()
      .regex(/^[0-9a-f-]+$/),
    balanceAfter: z.string().regex(/^(0|[1-9]\d{0,9})\.\d{2}$/),
  })
  .strict();

export type TopUpMetadata = z.infer<typeof metadataSchema>;

export function serializeTopUpMetadata(metadata: TopUpMetadata): string {
  return JSON.stringify(metadataSchema.parse(metadata));
}

export function readTopUpMetadata(transaction: Transaction): TopUpMetadata | null {
  if (
    transaction.type !== "topup" ||
    transaction.relatedSessionId !== null ||
    !transaction.amount.greaterThan(0) ||
    transaction.note === null
  )
    return null;
  try {
    const result = metadataSchema.safeParse(JSON.parse(transaction.note));
    if (
      !result.success ||
      transaction.id !== transactionRequestId("topup", transaction.userId, result.data.requestId)
    )
      return null;
    return result.data;
  } catch {
    return null;
  }
}
