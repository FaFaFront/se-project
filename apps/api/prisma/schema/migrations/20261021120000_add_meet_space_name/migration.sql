-- Existing sessions predate Meet API integration, so their space name is unknown.
ALTER TABLE "meet_sessions" ADD COLUMN "meetSpaceName" TEXT;
