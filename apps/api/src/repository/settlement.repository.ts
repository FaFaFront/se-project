import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { lockSession } from "./session.repository.js";
import { scheduledEnd, sessionCharge, settlementDue } from "../common/utils/session-policy.js";
import { transactionRequestId } from "../common/utils/transaction-id.js";
import { conversationRepository } from "./conversation.repository.js";
import { serializeMessage } from "../common/utils/message-presenter.js";

export const settlementRepository = {
  findDue(now: Date) {
    return prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "meet_sessions"
      WHERE "attendanceTrackingEnabled" = true AND "status" = 'ongoing'
        AND "scheduledAt" + ("durationHours" * INTERVAL '1 hour') + INTERVAL '15 minutes' <= ${now}
      ORDER BY "scheduledAt", "id"
    `;
  },

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
        const amount = sessionCharge(pricePerHour, session.durationHours);
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

  findPendingNotices() {
    return prisma.meetSession.findMany({
      where: {
        attendanceTrackingEnabled: true,
        status: { in: ["completed", "missed"] },
        settlementNotifiedAt: null,
        amountCharged: { not: null },
        endedAt: { not: null },
      },
      select: { id: true },
      orderBy: [{ scheduledAt: "asc" }, { id: "asc" }],
    });
  },

  async createSettlementNotice(id: string) {
    return prisma.$transaction(async (tx) => {
      await lockSession(tx, id);
      const session = await tx.meetSession.findUnique({
        where: { id },
        include: { classroom: true },
      });
      if (
        !session ||
        !session.attendanceTrackingEnabled ||
        session.settlementNotifiedAt ||
        !["completed", "missed"].includes(session.status) ||
        !session.endedAt ||
        session.amountCharged === null
      )
        return null;
      const date = new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Bangkok",
      }).format(session.scheduledAt);
      const text =
        session.status === "completed"
          ? `Session on ${date} (Bangkok) completed. THB ${session.amountCharged.toFixed(2)} was deducted from the student's wallet and credited to the tutor's wallet.`
          : `Session on ${date} (Bangkok) was missed because one or both participants did not join. Nobody was charged. Please book a new session.`;
      const message = await conversationRepository.createSystemMessage(
        session.classroom.tutorId,
        session.classroom.studentId,
        text,
        `session:${id}:settlement`,
        tx
      );
      await tx.meetSession.update({ where: { id }, data: { settlementNotifiedAt: new Date() } });
      return serializeMessage(message);
    });
  },
};
