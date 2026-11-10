-- Run with the API stopped. Existing half-hour presets convert exactly to minutes.
BEGIN;

ALTER TABLE "meet_sessions"
  ALTER COLUMN "durationHours" TYPE INTEGER USING ("durationHours" * 60)::INTEGER;
ALTER TABLE "meet_sessions" RENAME COLUMN "durationHours" TO "durationMinutes";

COMMIT;
