import type { Prisma } from "@prisma/client";

export const reviewSelect = {
  id: true,
  rating: true,
  comment: true,
  createdAt: true,
} as const satisfies Prisma.ReviewSelect;

export type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof reviewSelect }>;
