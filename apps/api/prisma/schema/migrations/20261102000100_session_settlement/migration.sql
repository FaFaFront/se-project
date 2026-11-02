ALTER TABLE "meet_sessions"
  ADD COLUMN "tutorJoinedAt" TIMESTAMP(3),
  ADD COLUMN "studentJoinedAt" TIMESTAMP(3),
  ADD COLUMN "settlementNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "attendanceTrackingEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "meet_sessions_attendanceTrackingEnabled_status_scheduledAt_idx"
  ON "meet_sessions"("attendanceTrackingEnabled", "status", "scheduledAt");

CREATE TYPE "MessageType" AS ENUM ('text', 'system');
ALTER TABLE "messages"
  ADD COLUMN "type" "MessageType" NOT NULL DEFAULT 'text',
  ADD COLUMN "systemEventKey" TEXT,
  ALTER COLUMN "senderId" DROP NOT NULL;
CREATE UNIQUE INDEX "messages_systemEventKey_key" ON "messages"("systemEventKey");

-- Run with the API stopped. Attendance was never recorded for legacy bookings.
-- Preserve cancellations and financial history, including previously charged rows.
UPDATE "meet_sessions" AS s
SET "status" = 'missed', "amountCharged" = 0
WHERE s."status" <> 'cancelled'
  AND COALESCE(s."amountCharged", 0) = 0
  AND NOT EXISTS (
    SELECT 1 FROM "transactions" t
    WHERE t."relatedSessionId" = s."id"
      AND t."type" IN ('session_charge', 'earning')
  );
