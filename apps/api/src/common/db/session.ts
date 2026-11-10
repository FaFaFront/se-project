import type { Prisma } from "@prisma/client";

// Shared by several repositories (session, classroom, conversation, transaction) so that
// no repository has to import another repository.

export const sessionSelect = {
  id: true,
  classroomId: true,
  scheduledAt: true,
  durationMinutes: true,
  status: true,
  meetLink: true,
  meetSpaceName: true,
  startedAt: true,
  endedAt: true,
  amountCharged: true,
  tutorJoinedAt: true,
  studentJoinedAt: true,
  attendanceTrackingEnabled: true,
} as const satisfies Prisma.MeetSessionSelect;

export type SessionRow = Prisma.MeetSessionGetPayload<{ select: typeof sessionSelect }>;

export async function lockSession(tx: Prisma.TransactionClient, id: string): Promise<void> {
  await tx.$queryRaw`SELECT "id" FROM "meet_sessions" WHERE "id" = ${id} FOR UPDATE`;
}
