import { Prisma } from "@prisma/client";

type ScheduledSession = { scheduledAt: Date; durationHours: Prisma.Decimal };
export const SETTLEMENT_GRACE_MS = 15 * 60 * 1000;

export function scheduledEnd(session: ScheduledSession): Date {
  return new Date(session.scheduledAt.getTime() + Number(session.durationHours) * 3_600_000);
}

export function settlementDue(session: ScheduledSession, now: Date): boolean {
  return now.getTime() >= scheduledEnd(session).getTime() + SETTLEMENT_GRACE_MS;
}

export function attendanceOpen(session: ScheduledSession, now: Date): boolean {
  return now >= session.scheduledAt && now < scheduledEnd(session);
}

export function sessionCharge(price: Prisma.Decimal, hours: Prisma.Decimal): Prisma.Decimal {
  return price.mul(hours).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}
