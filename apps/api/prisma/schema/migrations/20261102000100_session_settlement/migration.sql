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
-- Keep future scheduled bookings and collect their attendance normally. Ended bookings
-- become missed; other unpaid bookings are cancelled because attendance is incomplete.
WITH rollout AS (
  SELECT date_trunc('milliseconds', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') AS cutoff
)
UPDATE "meet_sessions" AS s
SET "status" = CASE
      WHEN s."scheduledAt" + s."durationHours" * INTERVAL '1 hour' <= rollout.cutoff
        THEN 'missed'::"MeetSessionStatus"
      WHEN s."status" = 'scheduled' AND s."scheduledAt" >= rollout.cutoff
        THEN 'scheduled'::"MeetSessionStatus"
      ELSE 'cancelled'::"MeetSessionStatus"
    END,
    "amountCharged" = CASE
      WHEN s."scheduledAt" + s."durationHours" * INTERVAL '1 hour' <= rollout.cutoff THEN 0
      ELSE s."amountCharged"
    END,
    "attendanceTrackingEnabled" = s."status" = 'scheduled' AND s."scheduledAt" >= rollout.cutoff
FROM rollout
WHERE s."status" <> 'cancelled'
  AND COALESCE(s."amountCharged", 0) = 0
  AND NOT EXISTS (
    SELECT 1 FROM "transactions" t
    WHERE t."relatedSessionId" = s."id"
      AND t."type" IN ('session_charge', 'earning')
  );
